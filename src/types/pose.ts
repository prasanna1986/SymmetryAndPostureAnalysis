/**
 * Pose landmark types and constants for MediaPipe integration.
 */

/** 3D coordinate from MediaPipe landmark */
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

/** Normalized landmark (0-1 range) */
export type NormalizedLandmark = Landmark;

/** World landmark (meters, centered at hip midpoint) */
export type WorldLandmark = Landmark;

/** Full pose detection result for a single frame */
export interface PoseResult {
  /** Normalized landmarks (33 points, 0-1 range relative to image) */
  landmarks: NormalizedLandmark[];
  /** World landmarks (33 points, in meters) */
  worldLandmarks: WorldLandmark[];
  /** Average visibility across all landmarks */
  overallConfidence: number;
  /** Timestamp in ms */
  timestamp: number;
}

/** Named landmark indices from MediaPipe Pose */
export enum LandmarkIndex {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32,
}

/** A pair of landmark indices that form a bone in the skeleton */
export type SkeletonConnection = [LandmarkIndex, LandmarkIndex];

/** Joint angle calculation result */
export interface JointAngle {
  /** Name of the angle (e.g. "left_knee_flexion") */
  name: string;
  /** Angle in degrees */
  degrees: number;
  /** Which landmarks formed this angle */
  landmarks: [LandmarkIndex, LandmarkIndex, LandmarkIndex];
  /** Confidence based on landmark visibility */
  confidence: number;
}
