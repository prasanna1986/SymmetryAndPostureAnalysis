/**
 * Zustand store for camera state management.
 */

import { create } from 'zustand';
import type { CameraDevice, CameraPermission } from '../types';

/** Input source for pose detection */
export type VideoSource = 'camera' | 'file';

interface CameraState {
  isStreaming: boolean;
  isMirrored: boolean;
  isFullscreen: boolean;
  selectedDeviceId: string | null;
  devices: CameraDevice[];
  permission: CameraPermission;
  fps: number;
  stream: MediaStream | null;
  error: string | null;
  /** Zoom level (1 = normal, 2 = 2x, etc.) */
  zoom: number;
  /** Current video source */
  videoSource: VideoSource;
  /** Name of loaded video file */
  videoFileName: string | null;

  // Actions
  setStreaming: (streaming: boolean) => void;
  setMirrored: (mirrored: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setSelectedDevice: (deviceId: string) => void;
  setDevices: (devices: CameraDevice[]) => void;
  setPermission: (permission: CameraPermission) => void;
  setFps: (fps: number) => void;
  setStream: (stream: MediaStream | null) => void;
  setError: (error: string | null) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setVideoSource: (source: VideoSource) => void;
  setVideoFileName: (name: string | null) => void;
  reset: () => void;
}

const initialState = {
  isStreaming: false,
  isMirrored: true,
  isFullscreen: false,
  selectedDeviceId: null as string | null,
  devices: [] as CameraDevice[],
  permission: 'prompt' as CameraPermission,
  fps: 0,
  stream: null as MediaStream | null,
  error: null as string | null,
  zoom: 1,
  videoSource: 'camera' as VideoSource,
  videoFileName: null as string | null,
};

export const useCameraStore = create<CameraState>((set) => ({
  ...initialState,

  setStreaming: (isStreaming) => set({ isStreaming }),
  setMirrored: (isMirrored) => set({ isMirrored }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setSelectedDevice: (selectedDeviceId) => set({ selectedDeviceId }),
  setDevices: (devices) => set({ devices }),
  setPermission: (permission) => set({ permission }),
  setFps: (fps) => set({ fps }),
  setStream: (stream) => set({ stream }),
  setError: (error) => set({ error }),
  setZoom: (zoom) => set({ zoom: Math.max(1, Math.min(4, zoom)) }),
  zoomIn: () => set((s) => ({ zoom: Math.min(4, s.zoom + 0.25) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(1, s.zoom - 0.25) })),
  setVideoSource: (videoSource) => set({ videoSource }),
  setVideoFileName: (videoFileName) => set({ videoFileName }),
  reset: () => set(initialState),
}));
