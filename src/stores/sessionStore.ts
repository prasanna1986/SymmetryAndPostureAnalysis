/**
 * Zustand store for session history.
 */

import { create } from 'zustand';
import type { Session, SessionSummary } from '../types';

interface SessionState {
  /** All stored sessions */
  sessions: SessionSummary[];
  /** Currently selected session for detail view */
  selectedSession: Session | null;
  /** Whether currently recording a session */
  isRecording: boolean;
  /** Recording start time */
  recordingStartTime: number | null;

  // Actions
  setSessions: (sessions: SessionSummary[]) => void;
  setSelectedSession: (session: Session | null) => void;
  setRecording: (recording: boolean) => void;
  setRecordingStartTime: (time: number | null) => void;
  addSession: (summary: SessionSummary) => void;
  removeSession: (id: string) => void;
  reset: () => void;
}

const initialState = {
  sessions: [] as SessionSummary[],
  selectedSession: null as Session | null,
  isRecording: false,
  recordingStartTime: null as number | null,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setSessions: (sessions) => set({ sessions }),
  setSelectedSession: (selectedSession) => set({ selectedSession }),
  setRecording: (isRecording) => set({ isRecording }),
  setRecordingStartTime: (recordingStartTime) => set({ recordingStartTime }),
  addSession: (summary) =>
    set((state) => ({ sessions: [summary, ...state.sessions] })),
  removeSession: (id) =>
    set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
  reset: () => set(initialState),
}));
