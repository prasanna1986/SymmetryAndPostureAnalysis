/**
 * Session history types for local storage.
 */

import type { AssessmentResult, MovementTestType } from './assessment';
import type { PostureMetrics } from './measurement';

/** A single saved assessment session */
export interface Session {
  /** Unique session ID */
  id: string;
  /** Session creation timestamp */
  date: number;
  /** Type of movement test performed */
  testType: MovementTestType;
  /** Display label for the test */
  testLabel: string;
  /** Posture measurements snapshot */
  measurements: PostureMetrics;
  /** Full assessment result */
  assessment: AssessmentResult;
  /** Overall score (0-100) */
  overallScore: number;
  /** Symmetry score (0-100) */
  symmetryScore: number;
  /** Duration in seconds */
  duration: number;
  /** Optional user notes */
  notes?: string;
}

/** Summary of a session for list display */
export interface SessionSummary {
  id: string;
  date: number;
  testType: MovementTestType;
  testLabel: string;
  overallScore: number;
  symmetryScore: number;
  findingsCount: number;
}

/** Comparison between two sessions */
export interface SessionComparison {
  sessionA: Session;
  sessionB: Session;
  scoreDelta: number;
  symmetryDelta: number;
  improvements: string[];
  regressions: string[];
}
