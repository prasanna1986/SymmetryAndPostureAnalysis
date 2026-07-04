/**
 * Deterministic rules engine for posture & movement assessment.
 * NO AI/ML classification — purely threshold-based.
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
 */
export function toConfidenceLevel(visibility: number): Confidence {
  if (visibility >= 0.7) return 'high';
  if (visibility >= 0.4) return 'medium';
  return 'low';
}

/**
 * Run a set of rules against a measurements map.
 * Returns all findings (rules that fired).
 */
export function runRules(
  rules: AssessmentRule[],
  measurements: Record<string, number>,
  confidences: Record<string, number> = {}
): AssessmentFinding[] {
  const findings: AssessmentFinding[] = [];

  for (const rule of rules) {
    const value = measurements[rule.metricKey];
    if (value === undefined || value === null) continue;

    // Use absolute value for symmetric metrics where sign indicates direction
    const testValue = rule.metricKey.includes('Shift') || rule.metricKey.includes('Rotation')
      ? Math.abs(value)
      : value;

    if (evaluateRule(rule, testValue)) {
      const visibility = confidences[rule.metricKey] ?? 0.5;
      findings.push({
        ruleId: rule.id,
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        confidence: toConfidenceLevel(visibility),
        message: rule.message,
        coaching: rule.coaching,
        measuredValue: value,
        threshold: rule.threshold,
      });
    }
  }

  // Sort by severity (most significant first)
  const severityOrder: Record<Severity, number> = {
    significant: 0,
    moderate: 1,
    mild: 2,
    normal: 3,
  };

  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return findings;
}

/**
 * Calculate an overall score from findings (0-100, higher is better).
 */
export function calculateScoreFromFindings(findings: AssessmentFinding[]): number {
  if (findings.length === 0) return 100;

  const severityPenalties: Record<Severity, number> = {
    normal: 0,
    mild: 5,
    moderate: 12,
    significant: 20,
  };

  const totalPenalty = findings.reduce(
    (sum, f) => sum + severityPenalties[f.severity],
    0
  );

  return Math.max(0, Math.min(100, 100 - totalPenalty));
}
