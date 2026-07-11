/**
 * Movement-specific metrics for dynamic assessment tests.
 *
 * Each metric checks that its required landmarks are available before computing.
 * Returns NaN for unavailable metrics so rules engine can skip them.
 */

import type { NormalizedLandmark, SquatMetrics, OverheadReachMetrics, ForwardBendMetrics } from '../types';
import { LandmarkIndex } from '../types';
import { allAvailable } from '../pose/landmarkFilter';
import {
  angleBetweenPoints,
  angleToVertical,
  distance2D,
  midpoint,
  lateralDisplacement,
} from './angleCalculations';

/**
 * Compute squat assessment metrics.
 */
export function computeSquatMetrics(
  landmarks: NormalizedLandmark[],
  available?: boolean[]
): SquatMetrics {
  const avail = available ?? landmarks.map((lm) => lm.visibility >= 0.55);

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

  const hipMid = allAvailable(avail, LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP)
    ? midpoint(lHip, rHip) : null;
  const shoulderMid = allAvailable(avail, LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER)
    ? midpoint(lShoulder, rShoulder) : null;
  const ankleMid = allAvailable(avail, LandmarkIndex.LEFT_ANKLE, LandmarkIndex.RIGHT_ANKLE)
    ? midpoint(lAnkle, rAnkle) : null;
  const shoulderWidth = shoulderMid ? distance2D(lShoulder, rShoulder) : 0;

  // Squat depth
  let depth = NaN;
  if (allAvailable(avail, LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_KNEE) &&
      allAvailable(avail, LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_KNEE)) {
    const leftHipAngle = angleBetweenPoints(lShoulder, lHip, lKnee);
    const rightHipAngle = angleBetweenPoints(rShoulder, rHip, rKnee);
    depth = (leftHipAngle + rightHipAngle) / 2;
  }

  // Knee tracking
  const leftKneeTracking = allAvailable(avail, LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_KNEE, LandmarkIndex.LEFT_ANKLE)
    ? 180 - angleBetweenPoints(lHip, lKnee, lAnkle) : NaN;
  const rightKneeTracking = allAvailable(avail, LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_KNEE, LandmarkIndex.RIGHT_ANKLE)
    ? 180 - angleBetweenPoints(rHip, rKnee, rAnkle) : NaN;

  // Hip shift
  const hipShift = (hipMid && ankleMid && shoulderWidth > 0)
    ? lateralDisplacement(ankleMid, hipMid, shoulderWidth) * 100 : NaN;

  // Trunk lean
  const trunkLean = (hipMid && shoulderMid)
    ? Math.abs(angleToVertical(hipMid, shoulderMid)) : NaN;

  // Heel lift
  let heelLift = NaN;
  if (allAvailable(avail, LandmarkIndex.LEFT_HEEL, LandmarkIndex.LEFT_FOOT_INDEX) &&
      allAvailable(avail, LandmarkIndex.RIGHT_HEEL, LandmarkIndex.RIGHT_FOOT_INDEX)) {
    const leftHeelLift = Math.max(0, (lToe.y - lHeel.y) * 100);
    const rightHeelLift = Math.max(0, (rToe.y - rHeel.y) * 100);
    heelLift = (leftHeelLift + rightHeelLift) / 2;
  }

  // Asymmetry
  let asymmetry = NaN;
  if (!isNaN(depth) &&
      allAvailable(avail, LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_KNEE) &&
      allAvailable(avail, LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_KNEE)) {
    const leftHipAngle = angleBetweenPoints(lShoulder, lHip, lKnee);
    const rightHipAngle = angleBetweenPoints(rShoulder, rHip, rKnee);
    asymmetry = Math.abs(leftHipAngle - rightHipAngle);
  }

  return { depth, leftKneeTracking, rightKneeTracking, hipShift, trunkLean, heelLift, asymmetry };
}

/**
 * Compute overhead reach assessment metrics.
 */
export function computeOverheadReachMetrics(
  landmarks: NormalizedLandmark[],
  available?: boolean[]
): OverheadReachMetrics {
  const avail = available ?? landmarks.map((lm) => lm.visibility >= 0.55);

  const lShoulder = landmarks[LandmarkIndex.LEFT_SHOULDER];
  const rShoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER];
  const lElbow = landmarks[LandmarkIndex.LEFT_ELBOW];
  const rElbow = landmarks[LandmarkIndex.RIGHT_ELBOW];
  const lWrist = landmarks[LandmarkIndex.LEFT_WRIST];
  const rWrist = landmarks[LandmarkIndex.RIGHT_WRIST];
  const lHip = landmarks[LandmarkIndex.LEFT_HIP];
  const rHip = landmarks[LandmarkIndex.RIGHT_HIP];

  const hipMid = allAvailable(avail, LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP)
    ? midpoint(lHip, rHip) : null;
  const shoulderMid = allAvailable(avail, LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER)
    ? midpoint(lShoulder, rShoulder) : null;

  const leftShoulderFlexion = allAvailable(avail, LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_ELBOW)
    ? angleBetweenPoints(lHip, lShoulder, lElbow) : NaN;
  const rightShoulderFlexion = allAvailable(avail, LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_ELBOW)
    ? angleBetweenPoints(rHip, rShoulder, rElbow) : NaN;
  const trunkCompensation = (hipMid && shoulderMid)
    ? Math.abs(angleToVertical(hipMid, shoulderMid)) : NaN;
  const leftElbowExtension = allAvailable(avail, LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_ELBOW, LandmarkIndex.LEFT_WRIST)
    ? angleBetweenPoints(lShoulder, lElbow, lWrist) : NaN;
  const rightElbowExtension = allAvailable(avail, LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_ELBOW, LandmarkIndex.RIGHT_WRIST)
    ? angleBetweenPoints(rShoulder, rElbow, rWrist) : NaN;
  const asymmetry = (!isNaN(leftShoulderFlexion) && !isNaN(rightShoulderFlexion))
    ? Math.abs(leftShoulderFlexion - rightShoulderFlexion) : NaN;

  return { leftShoulderFlexion, rightShoulderFlexion, trunkCompensation, leftElbowExtension, rightElbowExtension, asymmetry };
}

/**
 * Compute forward bend assessment metrics.
 */
export function computeForwardBendMetrics(
  landmarks: NormalizedLandmark[],
  available?: boolean[]
): ForwardBendMetrics {
  const avail = available ?? landmarks.map((lm) => lm.visibility >= 0.55);

  const lShoulder = landmarks[LandmarkIndex.LEFT_SHOULDER];
  const rShoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER];
  const lHip = landmarks[LandmarkIndex.LEFT_HIP];
  const rHip = landmarks[LandmarkIndex.RIGHT_HIP];
  const lKnee = landmarks[LandmarkIndex.LEFT_KNEE];
  const rKnee = landmarks[LandmarkIndex.RIGHT_KNEE];

  const shoulderMid = allAvailable(avail, LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER)
    ? midpoint(lShoulder, rShoulder) : null;
  const hipMid = allAvailable(avail, LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP)
    ? midpoint(lHip, rHip) : null;

  const spinalFlexion = (hipMid && shoulderMid)
    ? Math.abs(angleToVertical(hipMid, shoulderMid)) : NaN;

  let hipHinge = NaN;
  let symmetry = NaN;
  if (allAvailable(avail, LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_KNEE) &&
      allAvailable(avail, LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_KNEE)) {
    const leftHipHinge = angleBetweenPoints(lShoulder, lHip, lKnee);
    const rightHipHinge = angleBetweenPoints(rShoulder, rHip, rKnee);
    hipHinge = (leftHipHinge + rightHipHinge) / 2;
    const asymmetry = Math.abs(leftHipHinge - rightHipHinge);
    symmetry = Math.max(0, 100 - asymmetry * 4);
  }

  return { spinalFlexion, hipHinge, symmetry };
}
