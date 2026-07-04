/**
 * Pose readiness detection — determines if the user is in the correct
 * starting position for a given movement test.
 */

import type { NormalizedLandmark, MovementTestType } from '../types';
import { LandmarkIndex } from '../types';
import { distance2D, midpoint, angleBetweenPoints, angleToVertical } from '../measurements/angleCalculations';

export interface ReadinessCheck {
  isReady: boolean;
  message: string;
  /** 0-1 how stable the pose is (low movement between frames) */
  stability: number;
}

const MIN_VISIBILITY = 0.5;

/** Minimum landmarks that must be visible */
const REQUIRED_LANDMARKS: Record<MovementTestType, LandmarkIndex[]> = {
  standing_posture: [
    LandmarkIndex.NOSE, LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER,
    LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP, LandmarkIndex.LEFT_KNEE,
    LandmarkIndex.RIGHT_KNEE, LandmarkIndex.LEFT_ANKLE, LandmarkIndex.RIGHT_ANKLE,
  ],
  squat: [
    LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER,
    LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP, LandmarkIndex.LEFT_KNEE,
    LandmarkIndex.RIGHT_KNEE, LandmarkIndex.LEFT_ANKLE, LandmarkIndex.RIGHT_ANKLE,
  ],
  overhead_reach: [
    LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER,
    LandmarkIndex.LEFT_ELBOW, LandmarkIndex.RIGHT_ELBOW,
    LandmarkIndex.LEFT_WRIST, LandmarkIndex.RIGHT_WRIST,
    LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP,
  ],
  single_leg_balance: [
    LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER,
    LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP,
    LandmarkIndex.LEFT_KNEE, LandmarkIndex.RIGHT_KNEE,
    LandmarkIndex.LEFT_ANKLE, LandmarkIndex.RIGHT_ANKLE,
  ],
  forward_bend: [
    LandmarkIndex.NOSE, LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER,
    LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP,
    LandmarkIndex.LEFT_KNEE, LandmarkIndex.RIGHT_KNEE,
  ],
  free_analysis: [
    LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER,
    LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP,
  ],
  exercise_form: [
    LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER,
    LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP,
  ],
};

/**
 * Check if the user is roughly upright and standing still (for standing posture start).
 */
function isStandingUpright(landmarks: NormalizedLandmark[]): { ok: boolean; reason: string } {
  const shoulderMid = midpoint(landmarks[LandmarkIndex.LEFT_SHOULDER], landmarks[LandmarkIndex.RIGHT_SHOULDER]);
  const hipMid = midpoint(landmarks[LandmarkIndex.LEFT_HIP], landmarks[LandmarkIndex.RIGHT_HIP]);
  const trunkAngle = Math.abs(angleToVertical(hipMid, shoulderMid));
  if (trunkAngle > 20) return { ok: false, reason: 'Please stand upright' };

  // Arms should be roughly at sides (wrists below shoulders)
  const lWrist = landmarks[LandmarkIndex.LEFT_WRIST];
  const rWrist = landmarks[LandmarkIndex.RIGHT_WRIST];
  const lShoulder = landmarks[LandmarkIndex.LEFT_SHOULDER];
  const rShoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER];
  if (lWrist.visibility > MIN_VISIBILITY && lWrist.y < lShoulder.y - 0.05) {
    return { ok: false, reason: 'Lower your arms to your sides' };
  }
  if (rWrist.visibility > MIN_VISIBILITY && rWrist.y < rShoulder.y - 0.05) {
    return { ok: false, reason: 'Lower your arms to your sides' };
  }

  return { ok: true, reason: '' };
}

/** Running buffer to compute stability (average movement between frames) */
let prevLandmarks: NormalizedLandmark[] | null = null;

function computeStability(landmarks: NormalizedLandmark[]): number {
  if (!prevLandmarks) {
    prevLandmarks = landmarks;
    return 0;
  }
  let totalMovement = 0;
  let count = 0;
  for (let i = 0; i < Math.min(landmarks.length, prevLandmarks.length); i++) {
    if (landmarks[i].visibility > MIN_VISIBILITY && prevLandmarks[i].visibility > MIN_VISIBILITY) {
      totalMovement += distance2D(landmarks[i], prevLandmarks[i]);
      count++;
    }
  }
  prevLandmarks = landmarks;
  if (count === 0) return 0;
  const avgMovement = totalMovement / count;
  // Convert to 0-1 stability (lower movement = higher stability)
  return Math.max(0, Math.min(1, 1 - avgMovement * 50));
}

export function resetStabilityTracking(): void {
  prevLandmarks = null;
}

/**
 * Check if the user is ready for the selected test.
 */
export function checkReadiness(
  landmarks: NormalizedLandmark[],
  testType: MovementTestType
): ReadinessCheck {
  // 1. Check required landmarks are visible
  const required = REQUIRED_LANDMARKS[testType];
  const missingLandmarks = required.filter((idx) => landmarks[idx].visibility < MIN_VISIBILITY);
  if (missingLandmarks.length > 2) {
    return { isReady: false, message: 'Step back so your full body is visible', stability: 0 };
  }

  // 2. Test-specific pose checks
  if (testType === 'standing_posture' || testType === 'squat' || testType === 'forward_bend') {
    const upright = isStandingUpright(landmarks);
    if (!upright.ok) {
      return { isReady: false, message: upright.reason, stability: 0 };
    }
  }

  // 3. Stability check
  const stability = computeStability(landmarks);
  if (stability < 0.6) {
    return { isReady: false, message: 'Hold still...', stability };
  }

  return { isReady: true, message: 'Ready — hold your position', stability };
}
