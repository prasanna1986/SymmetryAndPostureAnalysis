/**
 * Zustand store for assessment state.
 * Includes assessment flow: idle → preparing (countdown) → recording → analyzing → complete
 */

import { create } from 'zustand';
import type {
  AssessmentResult,
  AssessmentFinding,
  AssessmentStatus,
  MovementTestType,
  Confidence,
} from '../types';
import type { PostureMetrics } from '../types';
import type { Recommendation } from '../types';

interface AssessmentState {
  activeTest: MovementTestType;
  status: AssessmentStatus;
  currentAssessment: AssessmentResult | null;
  findings: AssessmentFinding[];
  overallScore: number;
  symmetryScore: number;
  postureMetrics: PostureMetrics | null;
  recommendations: Recommendation[];
  confidence: Confidence;
  frameCount: number;

  /** Countdown seconds remaining before recording starts */
  countdown: number;
  /** Recording duration in seconds */
  recordingDuration: number;
  /** Elapsed recording time in seconds */
  recordingElapsed: number;
  /** Pose readiness message */
  readinessMessage: string;
  /** Whether pose is ready for assessment */
  isReady: boolean;
  /** Stability value 0-1 */
  stability: number;
  /** LLM-generated summary text */
  llmSummary: string | null;
  /** Whether LLM summary is loading */
  llmLoading: boolean;

  // Actions
  setActiveTest: (test: MovementTestType) => void;
  setStatus: (status: AssessmentStatus) => void;
  setCurrentAssessment: (result: AssessmentResult | null) => void;
  setFindings: (findings: AssessmentFinding[]) => void;
  setScores: (overall: number, symmetry: number) => void;
  setPostureMetrics: (metrics: PostureMetrics | null) => void;
  setRecommendations: (recs: Recommendation[]) => void;
  setConfidence: (confidence: Confidence) => void;
  incrementFrameCount: () => void;
  resetFrameCount: () => void;
  setCountdown: (n: number) => void;
  setRecordingDuration: (n: number) => void;
  setRecordingElapsed: (n: number) => void;
  setReadiness: (isReady: boolean, message: string, stability: number) => void;
  setLlmSummary: (summary: string | null) => void;
  setLlmLoading: (loading: boolean) => void;
  reset: () => void;
  resetAssessment: () => void;
}

const initialState = {
  activeTest: 'standing_posture' as MovementTestType,
  status: 'idle' as AssessmentStatus,
  currentAssessment: null as AssessmentResult | null,
  findings: [] as AssessmentFinding[],
  overallScore: 0,
  symmetryScore: 0,
  postureMetrics: null as PostureMetrics | null,
  recommendations: [] as Recommendation[],
  confidence: 'low' as Confidence,
  frameCount: 0,
  countdown: 0,
  recordingDuration: 5,
  recordingElapsed: 0,
  readinessMessage: '',
  isReady: false,
  stability: 0,
  llmSummary: null as string | null,
  llmLoading: false,
};

export const useAssessmentStore = create<AssessmentState>((set) => ({
  ...initialState,

  setActiveTest: (activeTest) => set({ activeTest }),
  setStatus: (status) => set({ status }),
  setCurrentAssessment: (currentAssessment) => set({ currentAssessment }),
  setFindings: (findings) => set({ findings }),
  setScores: (overallScore, symmetryScore) => set({ overallScore, symmetryScore }),
  setPostureMetrics: (postureMetrics) => set({ postureMetrics }),
  setRecommendations: (recommendations) => set({ recommendations }),
  setConfidence: (confidence) => set({ confidence }),
  incrementFrameCount: () => set((s) => ({ frameCount: s.frameCount + 1 })),
  resetFrameCount: () => set({ frameCount: 0 }),
  setCountdown: (countdown) => set({ countdown }),
  setRecordingDuration: (recordingDuration) => set({ recordingDuration }),
  setRecordingElapsed: (recordingElapsed) => set({ recordingElapsed }),
  setReadiness: (isReady, readinessMessage, stability) => set({ isReady, readinessMessage, stability }),
  setLlmSummary: (llmSummary) => set({ llmSummary }),
  setLlmLoading: (llmLoading) => set({ llmLoading }),
  reset: () => set(initialState),
  resetAssessment: () => set({
    status: 'idle',
    currentAssessment: null,
    findings: [],
    overallScore: 0,
    symmetryScore: 0,
    postureMetrics: null,
    recommendations: [],
    confidence: 'low',
    frameCount: 0,
    countdown: 0,
    recordingElapsed: 0,
    readinessMessage: '',
    isReady: false,
    stability: 0,
    llmSummary: null,
    llmLoading: false,
  }),
}));
