/**
 * Assessment runner — orchestrates rules evaluation for each test type.
 */

import type { AssessmentResult, MovementTestType } from '../types';
import type { PostureMetrics } from '../types';
import { runRules, calculateScoreFromFindings, toConfidenceLevel } from './rulesEngine';
import { standingPostureRules } from './rules/standingPostureRules';
import { squatRules } from './rules/squatRules';
import { overheadReachRules, singleLegBalanceRules, forwardBendRules } from './rules/movementRules';
import { freeAnalysisRules } from './rules/freeAnalysisRules';

/** Map test types to their rule sets */
const rulesByTestType: Record<MovementTestType, typeof standingPostureRules> = {
  standing_posture: standingPostureRules,
  squat: squatRules,
  overhead_reach: overheadReachRules,
  single_leg_balance: singleLegBalanceRules,
  forward_bend: forwardBendRules,
  free_analysis: freeAnalysisRules,
  exercise_form: freeAnalysisRules, // Uses same rules as baseline; LLM handles the rest
};

/** Human-readable test labels */
export const testLabels: Record<MovementTestType, string> = {
  standing_posture: 'Standing Posture',
  squat: 'Squat Assessment',
  overhead_reach: 'Overhead Reach',
  single_leg_balance: 'Single-Leg Balance',
  forward_bend: 'Forward Bend',
  free_analysis: 'Free Analysis',
  exercise_form: 'Exercise Form Check',
};

/**
 * Run a full assessment for a given test type against measurements.
 */
export function runAssessment(
  testType: MovementTestType,
  measurements: Record<string, number>,
  confidences: Record<string, number> = {},
  symmetryScore: number = 100
): AssessmentResult {
  const rules = rulesByTestType[testType] ?? [];
  const findings = runRules(rules, measurements, confidences);
  const overallScore = calculateScoreFromFindings(findings);

  const confValues = Object.values(confidences);
  const avgConf = confValues.length > 0
    ? confValues.reduce((a, b) => a + b, 0) / confValues.length
    : 0.5;

  return {
    testType,
    timestamp: Date.now(),
    overallScore,
    symmetryScore,
    findings,
    measurements,
    confidence: toConfidenceLevel(avgConf),
  };
}

/**
 * Run standing posture assessment from PostureMetrics.
 */
export function runPostureAssessment(metrics: PostureMetrics): AssessmentResult {
  const measurements: Record<string, number> = {
    forwardHeadAngle: metrics.forwardHeadAngle,
    shoulderHeightDiff: metrics.shoulderHeightDiff,
    shoulderRotation: metrics.shoulderRotation,
    pelvicTilt: metrics.pelvicTilt,
    pelvicRotation: metrics.pelvicRotation,
    hipShift: metrics.hipShift,
    leftKneeAngle: metrics.leftKneeAngle,
    rightKneeAngle: metrics.rightKneeAngle,
    trunkLean: metrics.trunkLean,
    spinalAlignment: metrics.spinalAlignment,
    weightShift: metrics.weightShift,
  };

  return runAssessment(
    'standing_posture',
    measurements,
    metrics.confidence,
    metrics.symmetryScore
  );
}
