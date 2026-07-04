/**
 * Biomechanical measurement types.
 */

/** A single biomechanical measurement */
export interface BiomechanicalMeasurement {
  /** Measurement name (e.g., "forward_head_angle") */
  name: string;
  /** Display label */
  label: string;
  /** Measured value */
  value: number;
  /** Unit of measurement */
  unit: 'degrees' | 'ratio' | 'percent' | 'pixels' | 'meters';
  /** Normal range [min, max] */
  normalRange: [number, number];
  /** Measurement confidence */
  confidence: number;
  /** Category grouping */
  category: 'head' | 'shoulders' | 'spine' | 'pelvis' | 'knees' | 'feet' | 'overall';
}

/** Complete set of posture metrics computed from a single frame */
export interface PostureMetrics {
  /** Forward head angle (degrees from vertical) — higher = more forward */
  forwardHeadAngle: number;
  /** Shoulder height difference (degrees of tilt) — positive = left higher */
  shoulderHeightDiff: number;
  /** Shoulder rotation (relative Z depth difference) */
  shoulderRotation: number;
  /** Pelvic tilt (degrees from horizontal) — positive = anterior tilt */
  pelvicTilt: number;
  /** Pelvic rotation (relative Z depth difference) */
  pelvicRotation: number;
  /** Hip shift (lateral displacement from center, normalized) */
  hipShift: number;
  /** Left knee valgus angle (degrees, positive = valgus, negative = varus) */
  leftKneeAngle: number;
  /** Right knee valgus angle (degrees, positive = valgus, negative = varus) */
  rightKneeAngle: number;
  /** Trunk lean (degrees from vertical) — positive = lean right */
  trunkLean: number;
  /** Spinal alignment deviation (higher = more deviated) */
  spinalAlignment: number;
  /** Weight shift (positive = shifted right, negative = shifted left) */
  weightShift: number;
  /** Overall bilateral symmetry score (0-100) */
  symmetryScore: number;
  /** Per-metric confidence values */
  confidence: Record<string, number>;
}

/** Movement-specific metrics for dynamic tests */
export interface SquatMetrics {
  /** Max depth achieved (hip angle in degrees, lower = deeper) */
  depth: number;
  /** Left knee valgus tracking throughout squat */
  leftKneeTracking: number;
  /** Right knee valgus tracking throughout squat */
  rightKneeTracking: number;
  /** Hip shift during squat (lateral displacement) */
  hipShift: number;
  /** Trunk lean at max depth */
  trunkLean: number;
  /** Heel lift detected (0 = no lift, higher = more lift) */
  heelLift: number;
  /** Left vs Right asymmetry score */
  asymmetry: number;
}

export interface OverheadReachMetrics {
  /** Left shoulder flexion angle */
  leftShoulderFlexion: number;
  /** Right shoulder flexion angle */
  rightShoulderFlexion: number;
  /** Trunk compensation (backward lean during reach) */
  trunkCompensation: number;
  /** Left elbow extension */
  leftElbowExtension: number;
  /** Right elbow extension */
  rightElbowExtension: number;
  /** L/R Asymmetry */
  asymmetry: number;
}

export interface SingleLegBalanceMetrics {
  /** Hip stability (amount of lateral sway) */
  hipStability: number;
  /** Pelvic drop on stance side */
  pelvicDrop: number;
  /** Trunk sway amplitude */
  trunkSway: number;
  /** Balance time in seconds */
  balanceTime: number;
  /** Side being tested */
  side: 'left' | 'right';
}

export interface ForwardBendMetrics {
  /** Spinal flexion (degrees) */
  spinalFlexion: number;
  /** Hip hinge angle */
  hipHinge: number;
  /** Left/right symmetry during bend */
  symmetry: number;
}

/** Union of all movement metrics */
export type MovementMetrics =
  | { type: 'squat'; data: SquatMetrics }
  | { type: 'overhead_reach'; data: OverheadReachMetrics }
  | { type: 'single_leg_balance'; data: SingleLegBalanceMetrics }
  | { type: 'forward_bend'; data: ForwardBendMetrics };
