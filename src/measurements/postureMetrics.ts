/**
 * Posture metrics computation from pose landmarks.
 * Computes all biomechanical measurements for static posture analysis.
 */

import type { NormalizedLandmark, PostureMetrics } from '../types';
import { LandmarkIndex } from '../types';
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
 */
export function computePostureMetrics(landmarks: NormalizedLandmark[]): PostureMetrics {
  if (landmarks.length < 33) {
    throw new Error(`Expected 33 landmarks, got ${landmarks.length}`);
  }

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

  const shoulderMid = midpoint(lShoulder, rShoulder);
  const hipMid = midpoint(lHip, rHip);
  const ankleMid = midpoint(lAnkle, rAnkle);
  const earMid = midpoint(lEar, rEar);

  // Reference distances for normalization
  const shoulderWidth = distance2D(lShoulder, rShoulder);

  const confidence: Record<string, number> = {};

  // 1. Forward Head Angle
  // Angle of ear→shoulder line relative to vertical. 0 = perfectly aligned, positive = forward.
  const forwardHeadAngle = Math.abs(angleToVertical(shoulderMid, earMid));
  confidence['forwardHeadAngle'] = minVisibility(lEar, rEar, lShoulder, rShoulder);

  // 2. Shoulder Height Difference
  // Angle of shoulder line from horizontal. Positive = left shoulder higher.
  const shoulderHeightDiff = angleToHorizontal(rShoulder, lShoulder);
  confidence['shoulderHeightDiff'] = minVisibility(lShoulder, rShoulder);

  // 3. Shoulder Rotation
  // Z-depth difference between shoulders. Positive = left shoulder more forward.
  const shoulderRotation = (lShoulder.z - rShoulder.z) * 100; // Scale for readability
  confidence['shoulderRotation'] = minVisibility(lShoulder, rShoulder);

  // 4. Pelvic Tilt
  // Angle of hip line from horizontal. In frontal view, this indicates lateral pelvic tilt.
  const pelvicTilt = angleToHorizontal(rHip, lHip);
  confidence['pelvicTilt'] = minVisibility(lHip, rHip);

  // 5. Pelvic Rotation
  // Z-depth difference between hips. Positive = left hip more forward.
  const pelvicRotation = (lHip.z - rHip.z) * 100;
  confidence['pelvicRotation'] = minVisibility(lHip, rHip);

  // 6. Hip Shift
  // Lateral displacement of hip center relative to ankle center, normalized by shoulder width.
  const hipShift = shoulderWidth > 0
    ? lateralDisplacement(ankleMid, hipMid, shoulderWidth) * 100
    : 0;
  confidence['hipShift'] = minVisibility(lHip, rHip, lAnkle, rAnkle);

  // 7. Left Knee Angle (valgus/varus in frontal plane)
  // Angle at knee formed by hip-knee-ankle. Deviation from 180° indicates valgus/varus.
  const leftKneeAngle = 180 - angleBetweenPoints(lHip, lKnee, lAnkle);
  confidence['leftKneeAngle'] = minVisibility(lHip, lKnee, lAnkle);

  // 8. Right Knee Angle
  const rightKneeAngle = 180 - angleBetweenPoints(rHip, rKnee, rAnkle);
  confidence['rightKneeAngle'] = minVisibility(rHip, rKnee, rAnkle);

  // 9. Trunk Lean
  // Angle of trunk (shoulder midpoint to hip midpoint) from vertical.
  // Positive = leaning right.
  const trunkLean = angleToVertical(hipMid, shoulderMid);
  confidence['trunkLean'] = minVisibility(lShoulder, rShoulder, lHip, rHip);

  // 10. Spinal Alignment
  // How much the nose deviates from the line between shoulder midpoint and hip midpoint.
  const spinalAlignment = deviationFromLine(nose, shoulderMid, hipMid) * 100;
  confidence['spinalAlignment'] = minVisibility(nose, lShoulder, rShoulder, lHip, rHip);

  // 11. Weight Shift
  // Lateral position of hip center relative to ankle center.
  // Positive = shifted right, negative = shifted left.
  const weightShift = shoulderWidth > 0
    ? ((hipMid.x - ankleMid.x) / shoulderWidth) * 100
    : 0;
  confidence['weightShift'] = minVisibility(lHip, rHip, lAnkle, rAnkle);

  // 12. Symmetry Score
  // Average bilateral symmetry across key metrics (0-100, 100 = perfect).
  const shoulderSymmetry = 100 - Math.min(Math.abs(shoulderHeightDiff) * 5, 100);
  const hipSymmetry = 100 - Math.min(Math.abs(pelvicTilt) * 5, 100);
  const kneeSymmetry = 100 - Math.min(Math.abs(leftKneeAngle - rightKneeAngle) * 5, 100);
  const weightSymmetry = 100 - Math.min(Math.abs(weightShift) * 5, 100);
  const symmetryScore = Math.max(
    0,
    Math.min(100, (shoulderSymmetry + hipSymmetry + kneeSymmetry + weightSymmetry) / 4)
  );

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
 * Higher is better.
 */
export function computeOverallScore(metrics: PostureMetrics): number {
  // Each metric contributes a penalty based on deviation from ideal
  const penalties = [
    Math.min(Math.abs(metrics.forwardHeadAngle) * 2, 25),       // max 25 penalty
    Math.min(Math.abs(metrics.shoulderHeightDiff) * 3, 15),      // max 15
    Math.min(Math.abs(metrics.trunkLean) * 2, 15),               // max 15
    Math.min(Math.abs(metrics.pelvicTilt) * 3, 15),              // max 15
    Math.min(Math.abs(metrics.hipShift) * 2, 10),                // max 10
    Math.min(Math.abs(metrics.leftKneeAngle) * 2, 10),          // max 10
    Math.min(Math.abs(metrics.rightKneeAngle) * 2, 10),         // max 10
  ];

  const totalPenalty = penalties.reduce((sum, p) => sum + p, 0);
  return Math.max(0, Math.min(100, 100 - totalPenalty));
}
