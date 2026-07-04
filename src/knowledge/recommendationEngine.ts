/**
 * Recommendation engine — matches assessment findings to knowledge base entries.
 * Generates prioritized recommendations with template-based explanations.
 */

import type { AssessmentFinding, Recommendation } from '../types';
import { knowledgeBase } from './knowledgeBase';

/**
 * Generate recommendations based on assessment findings.
 */
export function generateRecommendations(
  findings: AssessmentFinding[],
  measurements: Record<string, number>
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const matchedEntryIds = new Set<string>();

  for (const entry of knowledgeBase) {
    // Check if any of the entry's criteria are met by the measurements
    const isMatched = entry.criteria.some((criterion) => {
      const value = Math.abs(measurements[criterion.metricKey] ?? 0);
      if (criterion.minValue !== undefined && value < criterion.minValue) return false;
      if (criterion.maxValue !== undefined && value > criterion.maxValue) return false;
      return true;
    });

    if (isMatched && !matchedEntryIds.has(entry.id)) {
      matchedEntryIds.add(entry.id);

      // Determine priority based on severity of related findings
      const relatedFindings = findings.filter((f) =>
        entry.criteria.some((c) => {
          const value = Math.abs(measurements[c.metricKey] ?? 0);
          return c.minValue !== undefined && value >= c.minValue;
        })
      );

      const maxSeverity = getMaxSeverity(relatedFindings);
      const priority = severityToPriority(maxSeverity);

      // Build all exercises list
      const allExercises = [
        ...entry.recommendations.mobility,
        ...entry.recommendations.strength,
      ];

      // Generate template explanation
      const explanation = generateExplanation(entry.name, entry.description, relatedFindings);

      recommendations.push({
        knowledgeEntryId: entry.id,
        conditionName: entry.name,
        description: entry.description,
        priority,
        exercises: allExercises,
        awarenessTips: entry.recommendations.awareness,
        dailyHabits: entry.recommendations.dailyHabits,
        explanation,
      });
    }
  }

  // Sort by priority (1 = highest)
  recommendations.sort((a, b) => a.priority - b.priority);

  return recommendations;
}

/**
 * Get the maximum severity from a list of findings.
 */
function getMaxSeverity(findings: AssessmentFinding[]): string {
  const order = ['significant', 'moderate', 'mild', 'normal'];
  for (const severity of order) {
    if (findings.some((f) => f.severity === severity)) return severity;
  }
  return 'mild';
}

/**
 * Map severity to priority number.
 */
function severityToPriority(severity: string): number {
  switch (severity) {
    case 'significant': return 1;
    case 'moderate': return 2;
    case 'mild': return 3;
    default: return 4;
  }
}

/**
 * Generate a template-based natural language explanation.
 * Used as fallback when Ollama is not available.
 */
function generateExplanation(
  conditionName: string,
  description: string,
  relatedFindings: AssessmentFinding[]
): string {
  const findingMessages = relatedFindings.map((f) => `• ${f.message}`).join('\n');

  return (
    `Based on the assessment, ${conditionName.toLowerCase()} was observed. ` +
    `${description} ` +
    `\n\nObservations:\n${findingMessages || '• General pattern observed.'}\n\n` +
    `The exercises and tips recommended above may help address this pattern over time. ` +
    `These are general movement suggestions — not medical advice. ` +
    `If you experience pain or discomfort, please consult a healthcare professional.`
  );
}
