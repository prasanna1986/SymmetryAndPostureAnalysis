/**
 * Deterministic rules engine for posture & movement assessment.
 * NO AI/ML classification — purely threshold-based.
 *
 * ACCURACY NOTES:
 * - Rules are skipped when their metric is NaN (landmark unavailable).
 * - Low-confidence findings are tagged as tentative.
 * - Confidence thresholds are raised to reduce false positives.
 */

import type { AssessmentRule, AssessmentFinding, Severity, Confidence } from '../types';

/**
 * Evaluate a single rule against a measured value.
 * Returns true if the rule fires (condition is met).
 */
export function evaluateRule(rule: AssessmentRule, value: number): boolean {
  const { operator, threshold } = rule;

  switch (operator) {
    case '>':
      return value > (threshold as number);
    case '<':
      return value < (threshold as number);
    case '>=':
      return value >= (threshold as number);
    case '<=':
      return value <= (threshold as number);
    case 'between': {
      const [min, max] = threshold as [number, number];
      return value >= min && value <= max;
    }
    case 'outside': {
      const [min, max] = threshold as [number, number];
      return value < min || value > max;
    }
    default:
      return false;
  }
}

/**
 * Convert a numeric visibility score to a confidence level.
 * Raised thresholds to reduce false positives from noisy landmarks.
 */
export function toConfidenceLevel(visibility: number): Confidence {
  if (visibility >= 0.75) return 'high';
  if (visibility >= 0.55) return 'medium';
  return 'low';
}

/**
 * Run a set of rules against a measurements map.
 * Returns all findings (rules that fired).
 *
 * Key accuracy behavior:
 * - NaN metrics are SKIPPED (not evaluated) — this prevents findings from
 *   being generated for body parts that aren't visible.
 * - Low-confidence findings are still returned but sorted after higher ones.
 */
export function runRules(
  rules: AssessmentRule[],
  measurements: Record<string, number>,
  confidences: Record<string, number> = {}
): AssessmentFinding[] {
  const findings: AssessmentFinding[] = [];

  for (const rule of rules) {
    const value = measurements[rule.metricKey];

    // Skip if metric is missing, null, or NaN
    if (value === undefined || value === null || isNaN(value)) continue;

    // Use absolute value for symmetric metrics where sign indicates direction
    const testValue = rule.metricKey.includes('Shift') || rule.metricKey.includes('Rotation')
      ? Math.abs(value)
      : value;

    if (evaluateRule(rule, testValue)) {
      const visibility = confidences[rule.metricKey] ?? 0.5;
      const confidence = toConfidenceLevel(visibility);

      // Skip findings where confidence is too low to be meaningful
      if (visibility < 0.3) continue;

      findings.push({
        ruleId: rule.id,
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        confidence,
        message: rule.message,
        coaching: rule.coaching,
        measuredValue: value,
        threshold: rule.threshold,
      });
    }
  }

  // Sort by severity (most significant first), then by confidence (high first)
  const severityOrder: Record<Severity, number> = {
    significant: 0,
    moderate: 1,
    mild: 2,
    normal: 3,
  };
  const confOrder: Record<Confidence, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  findings.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return confOrder[a.confidence] - confOrder[b.confidence];
  });

  return findings;
}

/**
 * Calculate an overall score from findings (0-100, higher is better).
 * Low-confidence findings contribute less penalty.
 */
export function calculateScoreFromFindings(findings: AssessmentFinding[]): number {
  if (findings.length === 0) return 100;

  const severityPenalties: Record<Severity, number> = {
    normal: 0,
    mild: 4,
    moderate: 10,
    significant: 18,
  };

  const confMultiplier: Record<Confidence, number> = {
    high: 1.0,
    medium: 0.7,
    low: 0.4,
  };

  const totalPenalty = findings.reduce(
    (sum, f) => sum + severityPenalties[f.severity] * confMultiplier[f.confidence],
    0
  );

  return Math.max(0, Math.min(100, 100 - totalPenalty));
}
