/**
 * Recommendation and exercise types for the knowledge base.
 */

/** A single exercise recommendation */
export interface Exercise {
  /** Unique identifier */
  id: string;
  /** Exercise name */
  name: string;
  /** Brief description */
  description: string;
  /** Category */
  category: 'mobility' | 'strength' | 'awareness' | 'daily_habit';
  /** Target body area */
  targetArea: string;
  /** How to perform (step-by-step) */
  instructions: string[];
  /** Suggested sets/reps or duration */
  dosage: string;
  /** Difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/** A knowledge base entry linking a condition to recommendations */
export interface KnowledgeEntry {
  /** Unique identifier */
  id: string;
  /** Condition name (e.g., "Forward Head Posture") */
  name: string;
  /** Description of the condition */
  description: string;
  /** What assessment criteria trigger this entry */
  criteria: KnowledgeCriteria[];
  /** Recommended exercises and habits */
  recommendations: {
    mobility: Exercise[];
    strength: Exercise[];
    awareness: string[];
    dailyHabits: string[];
  };
}

/** Criteria for matching a knowledge entry to assessment findings */
export interface KnowledgeCriteria {
  /** The metric key to check */
  metricKey: string;
  /** Minimum value to trigger (inclusive) */
  minValue?: number;
  /** Maximum value to trigger (inclusive) */
  maxValue?: number;
}

/** A recommendation generated from matching findings to the knowledge base */
export interface Recommendation {
  /** Source knowledge entry */
  knowledgeEntryId: string;
  /** Condition name */
  conditionName: string;
  /** Description */
  description: string;
  /** Priority (1 = highest) */
  priority: number;
  /** All recommended exercises */
  exercises: Exercise[];
  /** Awareness tips */
  awarenessTips: string[];
  /** Daily habits */
  dailyHabits: string[];
  /** Natural language explanation */
  explanation: string;
}
