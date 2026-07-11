/**
 * Landmark signal processing layer.
 *
 * Sits between raw MediaPipe output and metric computation to:
 * 1. Reject anatomically implausible landmarks (bone length, joint limits, sudden jumps)
 * 2. Apply EMA temporal smoothing to reduce jitter
 * 3. Gate landmarks by visibility confidence
 * 4. Classify which body segments are actually visible
 * 5. Estimate floor reference from lowest visible foot landmarks
 */

import type { NormalizedLandmark } from '../types';
import { LandmarkIndex } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Which body segments are currently visible with sufficient confidence */
export interface BodyVisibility {
  head: boolean;
  shoulders: boolean;
  torso: boolean;
  hips: boolean;
  leftArm: boolean;
  rightArm: boolean;
  leftLeg: boolean;
  rightLeg: boolean;
  feet: boolean;
  /** How many of the 9 segments are visible */
  visibleCount: number;
  /** Human-readable description of what's visible */
  summary: string;
}

/** Floor reference computed from visible foot landmarks */
export interface FloorReference {
  /** Normalized Y coordinate of the estimated floor (0–1, higher = lower on screen) */
  y: number;
  /** Confidence of the floor estimate (0–1) */
  confidence: number;
  /** Whether the floor estimate is reliable */
  isReliable: boolean;
}

/** Result of the landmark filter pipeline */
export interface FilteredLandmarks {
  /** Smoothed, validated, gated landmarks (same 33-element array) */
  landmarks: NormalizedLandmark[];
  /** Which body segments are visible */
  bodyVisibility: BodyVisibility;
  /** Floor reference */
  floor: FloorReference;
  /** Per-landmark: true if this landmark passed all validation gates */
  available: boolean[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Minimum visibility to consider a landmark "available" for metrics */
const VISIBILITY_GATE = 0.55;

/** EMA smoothing factor for static tests (lower = more smoothing) */
const EMA_ALPHA_STATIC = 0.25;

/** EMA smoothing factor for dynamic tests (higher = more responsive) */
const EMA_ALPHA_DYNAMIC = 0.5;

/** Number of floor reference frames to average for stability */
const FLOOR_HISTORY_SIZE = 30;

/**
 * Maximum normalized distance a landmark can move between frames
 * before it's considered a tracking glitch (relative to body scale).
 * A value of 0.3 means 30% of the torso length.
 */
const MAX_JUMP_RATIO = 0.3;

/**
 * If a bone length is less than this fraction of its running average,
 * the landmarks are likely collapsed onto each other (e.g., shoulder pinned to elbow).
 */
const MIN_BONE_RATIO = 0.25;

/**
 * If a bone length is more than this fraction of its running average,
 * the landmark probably jumped to a wrong position.
 */
const MAX_BONE_RATIO = 2.5;

/** Number of frames to average for bone length history */
const BONE_HISTORY_SIZE = 30;

// ---------------------------------------------------------------------------
// Body segment definitions
// ---------------------------------------------------------------------------

const SEGMENT_LANDMARKS: Record<string, LandmarkIndex[]> = {
  head: [LandmarkIndex.NOSE, LandmarkIndex.LEFT_EAR, LandmarkIndex.RIGHT_EAR],
  shoulders: [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER],
  torso: [
    LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER,
    LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP,
  ],
  hips: [LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP],
  leftArm: [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_ELBOW, LandmarkIndex.LEFT_WRIST],
  rightArm: [LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_ELBOW, LandmarkIndex.RIGHT_WRIST],
  leftLeg: [LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_KNEE, LandmarkIndex.LEFT_ANKLE],
  rightLeg: [LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_KNEE, LandmarkIndex.RIGHT_ANKLE],
  feet: [
    LandmarkIndex.LEFT_ANKLE, LandmarkIndex.RIGHT_ANKLE,
    LandmarkIndex.LEFT_HEEL, LandmarkIndex.RIGHT_HEEL,
  ],
};

const SEGMENT_THRESHOLD = 0.6;

// ---------------------------------------------------------------------------
// Anatomical bone definitions (pairs that form physical bones)
// ---------------------------------------------------------------------------

interface BoneDef {
  /** Descriptive name */
  name: string;
  /** Start landmark index */
  from: LandmarkIndex;
  /** End landmark index */
  to: LandmarkIndex;
}

/**
 * All anatomical bones we validate.
 * If a bone length deviates wildly from its running average, we reject
 * both endpoints as implausible.
 */
const ANATOMICAL_BONES: BoneDef[] = [
  // Left arm
  { name: 'L Upper Arm', from: LandmarkIndex.LEFT_SHOULDER, to: LandmarkIndex.LEFT_ELBOW },
  { name: 'L Forearm',   from: LandmarkIndex.LEFT_ELBOW,    to: LandmarkIndex.LEFT_WRIST },
  // Right arm
  { name: 'R Upper Arm', from: LandmarkIndex.RIGHT_SHOULDER, to: LandmarkIndex.RIGHT_ELBOW },
  { name: 'R Forearm',   from: LandmarkIndex.RIGHT_ELBOW,    to: LandmarkIndex.RIGHT_WRIST },
  // Left leg
  { name: 'L Thigh',     from: LandmarkIndex.LEFT_HIP,   to: LandmarkIndex.LEFT_KNEE },
  { name: 'L Shin',      from: LandmarkIndex.LEFT_KNEE,   to: LandmarkIndex.LEFT_ANKLE },
  // Right leg
  { name: 'R Thigh',     from: LandmarkIndex.RIGHT_HIP,  to: LandmarkIndex.RIGHT_KNEE },
  { name: 'R Shin',      from: LandmarkIndex.RIGHT_KNEE,  to: LandmarkIndex.RIGHT_ANKLE },
  // Torso
  { name: 'L Torso',     from: LandmarkIndex.LEFT_SHOULDER,  to: LandmarkIndex.LEFT_HIP },
  { name: 'R Torso',     from: LandmarkIndex.RIGHT_SHOULDER, to: LandmarkIndex.RIGHT_HIP },
  // Shoulders & hips (cross-body)
  { name: 'Shoulders',   from: LandmarkIndex.LEFT_SHOULDER,  to: LandmarkIndex.RIGHT_SHOULDER },
  { name: 'Hips',        from: LandmarkIndex.LEFT_HIP,       to: LandmarkIndex.RIGHT_HIP },
];

// ---------------------------------------------------------------------------
// Floor reference landmarks
// ---------------------------------------------------------------------------

const FLOOR_LANDMARKS = [
  LandmarkIndex.LEFT_HEEL,
  LandmarkIndex.RIGHT_HEEL,
  LandmarkIndex.LEFT_FOOT_INDEX,
  LandmarkIndex.RIGHT_FOOT_INDEX,
  LandmarkIndex.LEFT_ANKLE,
  LandmarkIndex.RIGHT_ANKLE,
];

// ---------------------------------------------------------------------------
// Utility: 2D distance between two landmarks
// ---------------------------------------------------------------------------

function dist2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ---------------------------------------------------------------------------
// LandmarkFilter class
// ---------------------------------------------------------------------------

export class LandmarkFilter {
  /** Smoothed landmark positions */
  private smoothed: NormalizedLandmark[] | null = null;
  /** Previous frame's raw landmarks (for jump detection) */
  private prevRaw: NormalizedLandmark[] | null = null;
  /** Running average of each bone's length */
  private boneAvgLengths: Map<string, number[]> = new Map();
  /** EMA alpha */
  private alpha: number = EMA_ALPHA_STATIC;
  /** Floor history buffer */
  private floorHistory: number[] = [];
  /** Per-landmark rejection flag (set by anatomical checks) */
  private rejected: boolean[] = new Array(33).fill(false);

  /**
   * Set the smoothing mode.
   * Static tests use aggressive smoothing; dynamic tests use lighter smoothing.
   */
  setMode(dynamic: boolean): void {
    this.alpha = dynamic ? EMA_ALPHA_DYNAMIC : EMA_ALPHA_STATIC;
  }

  /**
   * Reset all internal state (call when switching tests or restarting camera).
   */
  reset(): void {
    this.smoothed = null;
    this.prevRaw = null;
    this.boneAvgLengths.clear();
    this.floorHistory = [];
    this.rejected = new Array(33).fill(false);
  }

  /**
   * Process a raw frame of landmarks through the full pipeline:
   *   raw → outlier rejection → bone length validation → EMA smoothing → visibility gate
   */
  process(raw: NormalizedLandmark[]): FilteredLandmarks {
    // 1. Outlier rejection: detect sudden position jumps
    this.rejectJumps(raw);

    // 2. Bone length validation: detect collapsed / exploded bones
    this.validateBoneLengths(raw);

    // 3. Apply corrected raw through EMA smoothing
    const landmarks = this.applyEMA(raw);

    // 4. Visibility gating (combines MediaPipe confidence + our rejection flags)
    const available = landmarks.map((lm, i) =>
      lm.visibility >= VISIBILITY_GATE && !this.rejected[i]
    );

    // 5. Body segment classification
    const bodyVisibility = classifyBodySegments(landmarks, available);

    // 6. Floor estimation
    const floor = this.estimateFloor(landmarks, available);

    // Store for next frame
    this.prevRaw = raw.map((lm) => ({ ...lm }));

    return { landmarks, bodyVisibility, floor, available };
  }

  // ---- 1. Outlier (jump) rejection ----

  private rejectJumps(raw: NormalizedLandmark[]): void {
    this.rejected.fill(false);

    if (!this.prevRaw) return;

    // Compute body scale from torso length (shoulder-mid to hip-mid)
    const bodyScale = this.getBodyScale(raw);
    if (bodyScale < 0.01) return; // Can't compute scale — skip

    const jumpThreshold = bodyScale * MAX_JUMP_RATIO;

    for (let i = 0; i < raw.length; i++) {
      // Only check visible landmarks
      if (raw[i].visibility < VISIBILITY_GATE) continue;
      if (this.prevRaw[i].visibility < VISIBILITY_GATE) continue;

      const d = dist2D(raw[i], this.prevRaw[i]);
      if (d > jumpThreshold) {
        // This landmark jumped too far — likely a tracking glitch
        this.rejected[i] = true;
      }
    }
  }

  // ---- 2. Bone length validation ----

  private validateBoneLengths(raw: NormalizedLandmark[]): void {
    for (const bone of ANATOMICAL_BONES) {
      const from = raw[bone.from];
      const to = raw[bone.to];

      // Skip if either endpoint is already rejected or invisible
      if (this.rejected[bone.from] || this.rejected[bone.to]) continue;
      if (from.visibility < VISIBILITY_GATE || to.visibility < VISIBILITY_GATE) continue;

      const length = dist2D(from, to);

      // Get or initialize the bone's length history
      let history = this.boneAvgLengths.get(bone.name);
      if (!history) {
        history = [];
        this.boneAvgLengths.set(bone.name, history);
      }

      if (history.length < 3) {
        // Not enough history — accept and record
        history.push(length);
        continue;
      }

      // Compute running average
      const avg = history.reduce((a, b) => a + b, 0) / history.length;

      // Check if current length is plausible
      if (avg > 0.005) { // Only validate if bone has meaningful length
        const ratio = length / avg;
        if (ratio < MIN_BONE_RATIO || ratio > MAX_BONE_RATIO) {
          // Bone is collapsed or exploded — reject the endpoint that moved more
          const fromDist = this.prevRaw ? dist2D(from, this.prevRaw[bone.from]) : 0;
          const toDist = this.prevRaw ? dist2D(to, this.prevRaw[bone.to]) : 0;

          if (fromDist > toDist) {
            this.rejected[bone.from] = true;
          } else {
            this.rejected[bone.to] = true;
          }
          continue; // Don't update history with bad data
        }
      }

      // Good measurement — add to history
      history.push(length);
      if (history.length > BONE_HISTORY_SIZE) {
        history.shift();
      }
    }
  }

  // ---- 3. EMA smoothing ----

  private applyEMA(raw: NormalizedLandmark[]): NormalizedLandmark[] {
    if (!this.smoothed) {
      this.smoothed = raw.map((lm) => ({ ...lm }));
      return this.smoothed.map((lm) => ({ ...lm }));
    }

    const result: NormalizedLandmark[] = [];
    for (let i = 0; i < raw.length; i++) {
      const r = raw[i];
      const s = this.smoothed[i];

      if (this.rejected[i] || r.visibility < VISIBILITY_GATE) {
        // Rejected or invisible — hold last good position, decay confidence
        result.push({
          x: s.x,
          y: s.y,
          z: s.z,
          visibility: s.visibility * 0.85, // Faster decay for rejected landmarks
        });
      } else {
        // Apply EMA: smoothed = α * raw + (1-α) * previous
        result.push({
          x: this.alpha * r.x + (1 - this.alpha) * s.x,
          y: this.alpha * r.y + (1 - this.alpha) * s.y,
          z: this.alpha * r.z + (1 - this.alpha) * s.z,
          visibility: this.alpha * r.visibility + (1 - this.alpha) * s.visibility,
        });
      }
    }

    this.smoothed = result.map((lm) => ({ ...lm }));
    return result;
  }

  // ---- Body scale estimation ----

  private getBodyScale(landmarks: NormalizedLandmark[]): number {
    const lShoulder = landmarks[LandmarkIndex.LEFT_SHOULDER];
    const rShoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER];
    const lHip = landmarks[LandmarkIndex.LEFT_HIP];
    const rHip = landmarks[LandmarkIndex.RIGHT_HIP];

    // Need at least shoulders or hips to estimate scale
    const shoulderVisible = lShoulder.visibility >= VISIBILITY_GATE && rShoulder.visibility >= VISIBILITY_GATE;
    const hipVisible = lHip.visibility >= VISIBILITY_GATE && rHip.visibility >= VISIBILITY_GATE;

    if (shoulderVisible && hipVisible) {
      // Full torso: use shoulder-mid to hip-mid distance
      const sMid = { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 };
      const hMid = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 };
      return Math.sqrt((sMid.x - hMid.x) ** 2 + (sMid.y - hMid.y) ** 2);
    }

    if (shoulderVisible) {
      // Shoulder width as proxy (roughly 1/3 of torso height)
      return dist2D(lShoulder, rShoulder) * 2;
    }

    if (hipVisible) {
      return dist2D(lHip, rHip) * 3;
    }

    return 0; // Can't determine scale
  }

  // ---- Floor estimation ----

  private estimateFloor(
    landmarks: NormalizedLandmark[],
    available: boolean[]
  ): FloorReference {
    const floorYs: number[] = [];
    for (const idx of FLOOR_LANDMARKS) {
      if (available[idx]) {
        floorYs.push(landmarks[idx].y);
      }
    }

    if (floorYs.length === 0) {
      return { y: 1.0, confidence: 0, isReliable: false };
    }

    const frameFloor = Math.max(...floorYs);

    this.floorHistory.push(frameFloor);
    if (this.floorHistory.length > FLOOR_HISTORY_SIZE) {
      this.floorHistory.shift();
    }

    const avgFloor = this.floorHistory.reduce((a, b) => a + b, 0) / this.floorHistory.length;
    const confidence = Math.min(1, floorYs.length / 4);

    return {
      y: avgFloor,
      confidence,
      isReliable: this.floorHistory.length >= 5 && confidence >= 0.5,
    };
  }
}

// ---------------------------------------------------------------------------
// Body segment classification
// ---------------------------------------------------------------------------

function classifyBodySegments(
  _landmarks: NormalizedLandmark[],
  available: boolean[]
): BodyVisibility {
  const check = (segment: string): boolean => {
    const indices = SEGMENT_LANDMARKS[segment];
    if (!indices || indices.length === 0) return false;
    const visibleCount = indices.filter((idx) => available[idx]).length;
    return visibleCount / indices.length >= SEGMENT_THRESHOLD;
  };

  const head = check('head');
  const shoulders = check('shoulders');
  const torso = check('torso');
  const hips = check('hips');
  const leftArm = check('leftArm');
  const rightArm = check('rightArm');
  const leftLeg = check('leftLeg');
  const rightLeg = check('rightLeg');
  const feet = check('feet');

  const segments = [head, shoulders, torso, hips, leftArm, rightArm, leftLeg, rightLeg, feet];
  const visibleCount = segments.filter(Boolean).length;

  let summary: string;
  if (visibleCount >= 8) {
    summary = 'Full body detected';
  } else if (torso && hips && (leftLeg || rightLeg)) {
    summary = 'Most of body visible' + (!head ? ' (head out of frame)' : '');
  } else if (torso && !leftLeg && !rightLeg) {
    summary = 'Upper body only — step back for full analysis';
  } else if (hips && (leftLeg || rightLeg) && !shoulders) {
    summary = 'Lower body only — step back for full analysis';
  } else if (visibleCount <= 2) {
    summary = 'Barely visible — please step into frame';
  } else {
    summary = 'Partial body — step back for best results';
  }

  return {
    head, shoulders, torso, hips,
    leftArm, rightArm, leftLeg, rightLeg, feet,
    visibleCount, summary,
  };
}

// ---------------------------------------------------------------------------
// Utility exports
// ---------------------------------------------------------------------------

/**
 * Returns true only if ALL the specified landmark indices passed the gate.
 * Use this in metric computations to decide whether to compute or return NaN.
 */
export function allAvailable(available: boolean[], ...indices: LandmarkIndex[]): boolean {
  return indices.every((idx) => available[idx]);
}

/**
 * Shared singleton instance.
 */
export const landmarkFilter = new LandmarkFilter();
