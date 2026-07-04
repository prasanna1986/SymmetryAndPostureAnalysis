/**
 * Movement-specific metrics for dynamic assessment tests.
 */

import type { NormalizedLandmark, SquatMetrics, OverheadReachMetrics, ForwardBendMetrics } from '../types';
import { LandmarkIndex } from '../types';
import {
  angleBetweenPoints,
  angleToVertical,
  distance2D,
  midpoint,
  minVisibility,
  lateralDisplacement,
} from './angleCalculations';

/**
 * Compute squat assessment metrics.
 */
export function computeSquatMetrics(landmarks: NormalizedLandmark[]): SquatMetrics {
  const lHip = landmarks[LandmarkIndex.LEFT_HIP];
  const rHip = landmarks[LandmarkIndex.RIGHT_HIP];
  const lKnee = landmarks[LandmarkIndex.LEFT_KNEE];
  const rKnee = landmarks[LandmarkIndex.RIGHT_KNEE];
  const lAnkle = landmarks[LandmarkIndex.LEFT_ANKLE];
  const rAnkle = landmarks[LandmarkIndex.RIGHT_ANKLE];
  const lShoulder = landmarks[LandmarkIndex.LEFT_SHOULDER];
  const rShoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER];
  const lHeel = landmarks[LandmarkIndex.LEFT_HEEL];
  const rHeel = landmarks[LandmarkIndex.RIGHT_HEEL];
  const lToe = landmarks[LandmarkIndex.LEFT_FOOT_INDEX];
  const rToe = landmarks[LandmarkIndex.RIGHT_FOOT_INDEX];

  const hipMid = midpoint(lHip, rHip);
  const shoulderMid = midpoint(lShoulder, rShoulder);
  const ankleMid = midpoint(lAnkle, rAnkle);
  const shoulderWidth = distance2D(lShoulder, rShoulder);

  // Squat depth: angle at the hip (shoulder-hip-knee), lower = deeper
  const leftHipAngle = angleBetweenPoints(lShoulder, lHip, lKnee);
  const rightHipAngle = angleBetweenPoints(rShoulder, rHip, rKnee);
  const depth = (leftHipAngle + rightHipAngle) / 2;

  // Knee tracking: frontal plane angle at knee (valgus/varus)
  const leftKneeTracking = 180 - angleBetweenPoints(lHip, lKnee, lAnkle);
  const rightKneeTracking = 180 - angleBetweenPoints(rHip, rKnee, rAnkle);

  // Hip shift during squat
  const hipShift = shoulderWidth > 0
    ? lateralDisplacement(ankleMid, hipMid, shoulderWidth) * 100
    : 0;

  // Trunk lean: angle of torso from vertical
  const trunkLean = Math.abs(angleToVertical(hipMid, shoulderMid));

  // Heel lift: vertical distance between heel and toe (if heel rises above expected)
  const leftHeelLift = Math.max(0, (lToe.y - lHeel.y) * 100);
  const rightHeelLift = Math.max(0, (rToe.y - rHeel.y) * 100);
  const heelLift = (leftHeelLift + rightHeelLift) / 2;

  // Asymmetry: difference in hip angles between sides
  const asymmetry = Math.abs(leftHipAngle - rightHipAngle);

  return {
    depth,
    leftKneeTracking,
    rightKneeTracking,
    hipShift,
    trunkLean,
    heelLift,
    asymmetry,
  };
}

/**
 * Compute overhead reach assessment metrics.
 */
export function computeOverheadReachMetrics(landmarks: NormalizedLandmark[]): OverheadReachMetrics {
  const lShoulder = landmarks[LandmarkIndex.LEFT_SHOULDER];
  const rShoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER];
  const lElbow = landmarks[LandmarkIndex.LEFT_ELBOW];
  const rElbow = landmarks[LandmarkIndex.RIGHT_ELBOW];
  const lWrist = landmarks[LandmarkIndex.LEFT_WRIST];
  const rWrist = landmarks[LandmarkIndex.RIGHT_WRIST];
  const lHip = landmarks[LandmarkIndex.LEFT_HIP];
  const rHip = landmarks[LandmarkIndex.RIGHT_HIP];

  const hipMid = midpoint(lHip, rHip);
  const shoulderMid = midpoint(lShoulder, rShoulder);

  // Shoulder flexion: angle at shoulder (hip-shoulder-elbow)
  // Full overhead reach ≈ 180°
  const leftShoulderFlexion = angleBetweenPoints(lHip, lShoulder, lElbow);
  const rightShoulderFlexion = angleBetweenPoints(rHip, rShoulder, rElbow);

  // Trunk compensation: backward lean during reach
  const trunkCompensation = Math.abs(angleToVertical(hipMid, shoulderMid));

  // Elbow extension: angle at elbow (shoulder-elbow-wrist)
  // Full extension = 180°
  const leftElbowExtension = angleBetweenPoints(lShoulder, lElbow, lWrist);
  const rightElbowExtension = angleBetweenPoints(rShoulder, rElbow, rWrist);

  // Asymmetry between sides
  const asymmetry = Math.abs(leftShoulderFlexion - rightShoulderFlexion);

  return {
    leftShoulderFlexion,
    rightShoulderFlexion,
    trunkCompensation,
    leftElbowExtension,
    rightElbowExtension,
    asymmetry,
  };
}

/**
 * Compute forward bend assessment metrics.
 */
export function computeForwardBendMetrics(landmarks: NormalizedLandmark[]): ForwardBendMetrics {
  const lShoulder = landmarks[LandmarkIndex.LEFT_SHOULDER];
  const rShoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER];
  const lHip = landmarks[LandmarkIndex.LEFT_HIP];
  const rHip = landmarks[LandmarkIndex.RIGHT_HIP];
  const lKnee = landmarks[LandmarkIndex.LEFT_KNEE];
  const rKnee = landmarks[LandmarkIndex.RIGHT_KNEE];
  const nose = landmarks[LandmarkIndex.NOSE];

  const shoulderMid = midpoint(lShoulder, rShoulder);
  const hipMid = midpoint(lHip, rHip);
  const kneeMid = midpoint(lKnee, rKnee);

  // Spinal flexion: angle of trunk from vertical (0 = standing, 90 = parallel to floor)
  const spinalFlexion = Math.abs(angleToVertical(hipMid, shoulderMid));

  // Hip hinge: angle at hip (shoulder-hip-knee)
  const leftHipHinge = angleBetweenPoints(lShoulder, lHip, lKnee);
  const rightHipHinge = angleBetweenPoints(rShoulder, rHip, rKnee);
  const hipHinge = (leftHipHinge + rightHipHinge) / 2;

  // Symmetry: compare left and right hip hinge angles
  const asymmetry = Math.abs(leftHipHinge - rightHipHinge);
  const symmetry = Math.max(0, 100 - asymmetry * 5);

  return {
    spinalFlexion,
    hipHinge,
    symmetry,
  };
}
