/**
 * Assessment types for the deterministic rules engine.
 */

/** Severity levels for assessment findings */
export type Severity = 'normal' | 'mild' | 'moderate' | 'significant';

/** Confidence level of a measurement */
export type Confidence = 'high' | 'medium' | 'low';

/** Comparison operators for rules */
export type RuleOperator = '>' | '<' | '>=' | '<=' | 'between' | 'outside';

/** Types of movement tests available */
export type MovementTestType =
  | 'standing_posture'
  | 'overhead_reach'
  | 'squat'
  | 'single_leg_balance'
  | 'forward_bend'
  | 'free_analysis'
  | 'exercise_form';

/** A single assessment rule definition */
export interface AssessmentRule {
  /** Unique identifier */
  id: string;
  /** Human-readable rule name */
  name: string;
  /** Which movement test this rule applies to */
  testType: MovementTestType;
  /** Category within the test */
  category: string;
  /** The metric key this rule evaluates */
  metricKey: string;
  /** Comparison operator */
  operator: RuleOperator;
  /** Threshold value(s) — single for >/</>=/<= or [min, max] for between/outside */
  threshold: number | [number, number];
  /** Severity when this rule fires */
  severity: Severity;
  /** Human-readable message when this rule fires */
  message: string;
  /** Additional coaching text */
  coaching?: string;
}

/** A single finding from running a rule against measurements */
export interface AssessmentFinding {
  /** The rule that fired */
  ruleId: string;
  /** Rule name */
  name: string;
  /** Category */
  category: string;
  /** Severity of the finding */
  severity: Severity;
  /** Confidence based on landmark visibility */
  confidence: Confidence;
  /** The message describing the finding */
  message: string;
  /** Optional coaching text */
  coaching?: string;
  /** The actual measured value */
  measuredValue: number;
  /** The threshold that triggered this */
  threshold: number | [number, number];
  /** Supporting measurements that contributed */
  supportingMetrics?: Record<string, number>;
}

/** Complete assessment result for a test */
export interface AssessmentResult {
  /** Which test was run */
  testType: MovementTestType;
  /** Timestamp of assessment */
  timestamp: number;
  /** Overall movement quality score (0-100) */
  overallScore: number;
  /** Left/Right symmetry score (0-100, 100 = perfectly symmetric) */
  symmetryScore: number;
  /** All findings from the assessment */
  findings: AssessmentFinding[];
  /** Raw measurements used */
  measurements: Record<string, number>;
  /** Overall confidence of the assessment */
  confidence: Confidence;
  /** Duration of the assessment in seconds */
  duration?: number;
}

/** Status of an ongoing assessment */
export type AssessmentStatus = 'idle' | 'preparing' | 'recording' | 'analyzing' | 'complete';
