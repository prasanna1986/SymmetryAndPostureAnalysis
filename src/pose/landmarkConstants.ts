/**
 * Landmark constants for MediaPipe Pose.
 * Skeleton connection definitions and display labels.
 */

import { LandmarkIndex, type SkeletonConnection } from '../types';

/** All skeleton connections (bones) for drawing */
export const SKELETON_CONNECTIONS: SkeletonConnection[] = [
  // Face
  [LandmarkIndex.NOSE, LandmarkIndex.LEFT_EYE_INNER],
  [LandmarkIndex.LEFT_EYE_INNER, LandmarkIndex.LEFT_EYE],
  [LandmarkIndex.LEFT_EYE, LandmarkIndex.LEFT_EYE_OUTER],
  [LandmarkIndex.LEFT_EYE_OUTER, LandmarkIndex.LEFT_EAR],
  [LandmarkIndex.NOSE, LandmarkIndex.RIGHT_EYE_INNER],
  [LandmarkIndex.RIGHT_EYE_INNER, LandmarkIndex.RIGHT_EYE],
  [LandmarkIndex.RIGHT_EYE, LandmarkIndex.RIGHT_EYE_OUTER],
  [LandmarkIndex.RIGHT_EYE_OUTER, LandmarkIndex.RIGHT_EAR],
  [LandmarkIndex.MOUTH_LEFT, LandmarkIndex.MOUTH_RIGHT],

  // Torso
  [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER],
  [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_HIP],
  [LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_HIP],
  [LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP],

  // Left arm
  [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_ELBOW],
  [LandmarkIndex.LEFT_ELBOW, LandmarkIndex.LEFT_WRIST],
  [LandmarkIndex.LEFT_WRIST, LandmarkIndex.LEFT_PINKY],
  [LandmarkIndex.LEFT_WRIST, LandmarkIndex.LEFT_INDEX],
  [LandmarkIndex.LEFT_WRIST, LandmarkIndex.LEFT_THUMB],
  [LandmarkIndex.LEFT_INDEX, LandmarkIndex.LEFT_PINKY],

  // Right arm
  [LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_ELBOW],
  [LandmarkIndex.RIGHT_ELBOW, LandmarkIndex.RIGHT_WRIST],
  [LandmarkIndex.RIGHT_WRIST, LandmarkIndex.RIGHT_PINKY],
  [LandmarkIndex.RIGHT_WRIST, LandmarkIndex.RIGHT_INDEX],
  [LandmarkIndex.RIGHT_WRIST, LandmarkIndex.RIGHT_THUMB],
  [LandmarkIndex.RIGHT_INDEX, LandmarkIndex.RIGHT_PINKY],

  // Left leg
  [LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_KNEE],
  [LandmarkIndex.LEFT_KNEE, LandmarkIndex.LEFT_ANKLE],
  [LandmarkIndex.LEFT_ANKLE, LandmarkIndex.LEFT_HEEL],
  [LandmarkIndex.LEFT_ANKLE, LandmarkIndex.LEFT_FOOT_INDEX],
  [LandmarkIndex.LEFT_HEEL, LandmarkIndex.LEFT_FOOT_INDEX],

  // Right leg
  [LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_KNEE],
  [LandmarkIndex.RIGHT_KNEE, LandmarkIndex.RIGHT_ANKLE],
  [LandmarkIndex.RIGHT_ANKLE, LandmarkIndex.RIGHT_HEEL],
  [LandmarkIndex.RIGHT_ANKLE, LandmarkIndex.RIGHT_FOOT_INDEX],
  [LandmarkIndex.RIGHT_HEEL, LandmarkIndex.RIGHT_FOOT_INDEX],
];

/** Human-readable labels for key landmarks */
export const LANDMARK_LABELS: Partial<Record<LandmarkIndex, string>> = {
  [LandmarkIndex.NOSE]: 'Nose',
  [LandmarkIndex.LEFT_EYE]: 'L Eye',
  [LandmarkIndex.RIGHT_EYE]: 'R Eye',
  [LandmarkIndex.LEFT_EAR]: 'L Ear',
  [LandmarkIndex.RIGHT_EAR]: 'R Ear',
  [LandmarkIndex.LEFT_SHOULDER]: 'L Shoulder',
  [LandmarkIndex.RIGHT_SHOULDER]: 'R Shoulder',
  [LandmarkIndex.LEFT_ELBOW]: 'L Elbow',
  [LandmarkIndex.RIGHT_ELBOW]: 'R Elbow',
  [LandmarkIndex.LEFT_WRIST]: 'L Wrist',
  [LandmarkIndex.RIGHT_WRIST]: 'R Wrist',
  [LandmarkIndex.LEFT_HIP]: 'L Hip',
  [LandmarkIndex.RIGHT_HIP]: 'R Hip',
  [LandmarkIndex.LEFT_KNEE]: 'L Knee',
  [LandmarkIndex.RIGHT_KNEE]: 'R Knee',
  [LandmarkIndex.LEFT_ANKLE]: 'L Ankle',
  [LandmarkIndex.RIGHT_ANKLE]: 'R Ankle',
  [LandmarkIndex.LEFT_HEEL]: 'L Heel',
  [LandmarkIndex.RIGHT_HEEL]: 'R Heel',
  [LandmarkIndex.LEFT_FOOT_INDEX]: 'L Toe',
  [LandmarkIndex.RIGHT_FOOT_INDEX]: 'R Toe',
};

/** Key landmarks that should always be labeled */
export const KEY_LANDMARKS: LandmarkIndex[] = [
  LandmarkIndex.NOSE,
  LandmarkIndex.LEFT_SHOULDER,
  LandmarkIndex.RIGHT_SHOULDER,
  LandmarkIndex.LEFT_ELBOW,
  LandmarkIndex.RIGHT_ELBOW,
  LandmarkIndex.LEFT_WRIST,
  LandmarkIndex.RIGHT_WRIST,
  LandmarkIndex.LEFT_HIP,
  LandmarkIndex.RIGHT_HIP,
  LandmarkIndex.LEFT_KNEE,
  LandmarkIndex.RIGHT_KNEE,
  LandmarkIndex.LEFT_ANKLE,
  LandmarkIndex.RIGHT_ANKLE,
];

/** Minimum visibility threshold for rendering a landmark */
export const MIN_VISIBILITY = 0.5;

/** Color for left-side landmarks */
export const LEFT_COLOR = '#00d4ff';

/** Color for right-side landmarks */
export const RIGHT_COLOR = '#00e676';

/** Color for center landmarks */
export const CENTER_COLOR = '#a78bfa';

/** Get the side color for a landmark index */
export function getLandmarkColor(index: LandmarkIndex): string {
  // Center landmarks
  if (index === LandmarkIndex.NOSE) return CENTER_COLOR;
  // Odd indices = left side (from subject perspective)
  if (index % 2 === 1) return LEFT_COLOR;
  // Even indices = right side
  return RIGHT_COLOR;
}
