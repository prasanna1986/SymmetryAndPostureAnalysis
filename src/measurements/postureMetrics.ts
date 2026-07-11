/**
 * Posture metrics computation from pose landmarks.
 * Computes all biomechanical measurements for static posture analysis.
 *
 * ACCURACY NOTES:
 * - Every metric checks that its required landmarks are available (visibility-gated).
 * - If required landmarks are unavailable, the metric returns NaN and confidence 0.
 * - Downstream consumers (rules engine) must handle NaN gracefully.
 */

import type { NormalizedLandmark, PostureMetrics } from '../types';
import { LandmarkIndex } from '../types';
import { allAvailable } from '../pose/landmarkFilter';
import {
  angleBetweenPoints,
  angleToVertical,
  angleToHorizontal,
  distance2D,
  midpoint,
  minVisibility,
  deviationFromLine,
  lateralDisplacement,
} from './angleCalculations';

/**
 * Compute all posture metrics from a set of 33 landmarks.
 * All angles are in degrees. Positive/negative conventions documented per metric.
 *
 * @param landmarks - The 33 pose landmarks (smoothed + validated)
 * @param available - Per-landmark availability flags from the filter pipeline.
 *                    If omitted, all landmarks with visibility >= 0.55 are considered available.
 */
export function computePostureMetrics(
  landmarks: NormalizedLandmark[],
  available?: boolean[]
): PostureMetrics {
  if (landmarks.length < 33) {
    throw new Error(`Expected 33 landmarks, got ${landmarks.length}`);
  }

  // If no availability array provided, fall back to visibility-based
  const avail = available ?? landmarks.map((lm) => lm.visibility >= 0.55);

  const nose = landmarks[LandmarkIndex.NOSE];
  const lEar = landmarks[LandmarkIndex.LEFT_EAR];
  const rEar = landmarks[LandmarkIndex.RIGHT_EAR];
  const lShoulder = landmarks[LandmarkIndex.LEFT_SHOULDER];
  const rShoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER];
  const lHip = landmarks[LandmarkIndex.LEFT_HIP];
  const rHip = landmarks[LandmarkIndex.RIGHT_HIP];
  const lKnee = landmarks[LandmarkIndex.LEFT_KNEE];
  const rKnee = landmarks[LandmarkIndex.RIGHT_KNEE];
  const lAnkle = landmarks[LandmarkIndex.LEFT_ANKLE];
  const rAnkle = landmarks[LandmarkIndex.RIGHT_ANKLE];

  const confidence: Record<string, number> = {};

  // Helper: compute a metric only if required landmarks are available
  const safeMetric = (
    key: string,
    requiredIndices: LandmarkIndex[],
    compute: () => number
  ): number => {
    if (!allAvailable(avail, ...requiredIndices)) {
      confidence[key] = 0;
      return NaN;
    }
    const vis = minVisibility(...requiredIndices.map((i) => landmarks[i]));
    confidence[key] = vis;
    return compute();
  };

  // Midpoints (computed only when both sides are available)
  const shoulderMid = allAvailable(avail, LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER)
    ? midpoint(lShoulder, rShoulder) : null;
  const hipMid = allAvailable(avail, LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP)
    ? midpoint(lHip, rHip) : null;
  const ankleMid = allAvailable(avail, LandmarkIndex.LEFT_ANKLE, LandmarkIndex.RIGHT_ANKLE)
    ? midpoint(lAnkle, rAnkle) : null;

  const shoulderWidth = shoulderMid ? distance2D(lShoulder, rShoulder) : 0;

  // 1. Forward Head Angle
  const forwardHeadAngle = safeMetric(
    'forwardHeadAngle',
    [LandmarkIndex.LEFT_EAR, LandmarkIndex.RIGHT_EAR, LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER],
    () => {
      const earMid = midpoint(lEar, rEar);
      return Math.abs(angleToVertical(shoulderMid!, earMid));
    }
  );

  // 2. Shoulder Height Difference
  const shoulderHeightDiff = safeMetric(
    'shoulderHeightDiff',
    [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER],
    () => angleToHorizontal(rShoulder, lShoulder)
  );

  // 3. Shoulder Rotation
  const shoulderRotation = safeMetric(
    'shoulderRotation',
    [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER],
    () => (lShoulder.z - rShoulder.z) * 100
  );

  // 4. Pelvic Tilt
  const pelvicTilt = safeMetric(
    'pelvicTilt',
    [LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP],
    () => angleToHorizontal(rHip, lHip)
  );

  // 5. Pelvic Rotation
  const pelvicRotation = safeMetric(
    'pelvicRotation',
    [LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP],
    () => (lHip.z - rHip.z) * 100
  );

  // 6. Hip Shift (requires hips AND ankles for reference)
  const hipShift = safeMetric(
    'hipShift',
    [LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP, LandmarkIndex.LEFT_ANKLE, LandmarkIndex.RIGHT_ANKLE],
    () => shoulderWidth > 0 ? lateralDisplacement(ankleMid!, hipMid!, shoulderWidth) * 100 : 0
  );

  // 7. Left Knee Angle
  const leftKneeAngle = safeMetric(
    'leftKneeAngle',
    [LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_KNEE, LandmarkIndex.LEFT_ANKLE],
    () => 180 - angleBetweenPoints(lHip, lKnee, lAnkle)
  );

  // 8. Right Knee Angle
  const rightKneeAngle = safeMetric(
    'rightKneeAngle',
    [LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_KNEE, LandmarkIndex.RIGHT_ANKLE],
    () => 180 - angleBetweenPoints(rHip, rKnee, rAnkle)
  );

  // 9. Trunk Lean
  const trunkLean = safeMetric(
    'trunkLean',
    [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP],
    () => angleToVertical(hipMid!, shoulderMid!)
  );

  // 10. Spinal Alignment
  const spinalAlignment = safeMetric(
    'spinalAlignment',
    [LandmarkIndex.NOSE, LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP],
    () => deviationFromLine(nose, shoulderMid!, hipMid!) * 100
  );

  // 11. Weight Shift (requires hips AND ankles)
  const weightShift = safeMetric(
    'weightShift',
    [LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP, LandmarkIndex.LEFT_ANKLE, LandmarkIndex.RIGHT_ANKLE],
    () => shoulderWidth > 0 ? ((hipMid!.x - ankleMid!.x) / shoulderWidth) * 100 : 0
  );

  // 12. Symmetry Score (only from metrics that are actually available)
  const symmetryParts: number[] = [];
  if (!isNaN(shoulderHeightDiff)) {
    symmetryParts.push(100 - Math.min(Math.abs(shoulderHeightDiff) * 4, 100));
  }
  if (!isNaN(pelvicTilt)) {
    symmetryParts.push(100 - Math.min(Math.abs(pelvicTilt) * 4, 100));
  }
  if (!isNaN(leftKneeAngle) && !isNaN(rightKneeAngle)) {
    symmetryParts.push(100 - Math.min(Math.abs(leftKneeAngle - rightKneeAngle) * 4, 100));
  }
  if (!isNaN(weightShift)) {
    symmetryParts.push(100 - Math.min(Math.abs(weightShift) * 4, 100));
  }
  const symmetryScore = symmetryParts.length > 0
    ? Math.max(0, Math.min(100, symmetryParts.reduce((a, b) => a + b, 0) / symmetryParts.length))
    : NaN;

  return {
    forwardHeadAngle,
    shoulderHeightDiff,
    shoulderRotation,
    pelvicTilt,
    pelvicRotation,
    hipShift,
    leftKneeAngle,
    rightKneeAngle,
    trunkLean,
    spinalAlignment,
    weightShift,
    symmetryScore,
    confidence,
  };
}

/**
 * Compute the overall posture score from metrics (0-100).
 * Higher is better. Only penalizes metrics that are actually available.
 */
export function computeOverallScore(metrics: PostureMetrics): number {
  const penaltyDefs: [keyof PostureMetrics, number, number][] = [
    ['forwardHeadAngle', 1.5, 25],  // multiplier, max penalty
    ['shoulderHeightDiff', 2, 15],
    ['trunkLean', 1.5, 15],
    ['pelvicTilt', 2, 15],
    ['hipShift', 1.5, 10],
    ['leftKneeAngle', 1.5, 10],
    ['rightKneeAngle', 1.5, 10],
  ];

  let totalPenalty = 0;
  let metricsUsed = 0;

  for (const [key, multiplier, maxPenalty] of penaltyDefs) {
    const value = metrics[key];
    if (typeof value === 'number' && !isNaN(value)) {
      totalPenalty += Math.min(Math.abs(value) * multiplier, maxPenalty);
      metricsUsed++;
    }
  }

  // If very few metrics are available, cap the score to reflect uncertainty
  if (metricsUsed <= 2) {
    // Not enough data for a meaningful score
    return Math.max(50, 100 - totalPenalty);
  }

  return Math.max(0, Math.min(100, 100 - totalPenalty));
}
