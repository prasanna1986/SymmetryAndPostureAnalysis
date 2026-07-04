/**
 * Zustand store for pose detection state.
 */

import { create } from 'zustand';
import type { NormalizedLandmark, WorldLandmark, Confidence } from '../types';

interface PoseState {
  /** Current frame normalized landmarks */
  landmarks: NormalizedLandmark[] | null;
  /** Current frame world landmarks */
  worldLandmarks: WorldLandmark[] | null;
  /** Overall detection confidence */
  confidence: number;
  /** Confidence level category */
  confidenceLevel: Confidence;
  /** Whether pose detection is actively running */
  isDetecting: boolean;
  /** Pose detection FPS */
  detectionFps: number;
  /** Whether the pose detector is initialized */
  isInitialized: boolean;
  /** Loading state for initialization */
  isLoading: boolean;
  /** Error during detection */
  error: string | null;

  // Actions
  setLandmarks: (landmarks: NormalizedLandmark[] | null) => void;
  setWorldLandmarks: (worldLandmarks: WorldLandmark[] | null) => void;
  setConfidence: (confidence: number) => void;
  setDetecting: (detecting: boolean) => void;
  setDetectionFps: (fps: number) => void;
  setInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

function getConfidenceLevel(confidence: number): Confidence {
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.4) return 'medium';
  return 'low';
}

const initialState = {
  landmarks: null as NormalizedLandmark[] | null,
  worldLandmarks: null as WorldLandmark[] | null,
  confidence: 0,
  confidenceLevel: 'low' as Confidence,
  isDetecting: false,
  detectionFps: 0,
  isInitialized: false,
  isLoading: false,
  error: null as string | null,
};

export const usePoseStore = create<PoseState>((set) => ({
  ...initialState,

  setLandmarks: (landmarks) => set({ landmarks }),
  setWorldLandmarks: (worldLandmarks) => set({ worldLandmarks }),
  setConfidence: (confidence) =>
    set({ confidence, confidenceLevel: getConfidenceLevel(confidence) }),
  setDetecting: (isDetecting) => set({ isDetecting }),
  setDetectionFps: (detectionFps) => set({ detectionFps }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
