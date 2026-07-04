/**
 * PoseDetector — MediaPipe Pose Landmarker integration.
 * Handles initialization, frame processing, and cleanup.
 */

import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '../types';

/** Callback for pose detection results */
export type PoseResultCallback = (
  landmarks: NormalizedLandmark[],
  worldLandmarks: NormalizedLandmark[],
  timestamp: number
) => void;

/**
 * Singleton-style pose detector service.
 * Manages MediaPipe PoseLandmarker lifecycle.
 */
export class PoseDetector {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitializing = false;
  private lastTimestamp = -1;

  /**
   * Initialize the MediaPipe Pose Landmarker.
   * Downloads WASM runtime and model on first call.
   */
  async initialize(): Promise<void> {
    if (this.poseLandmarker || this.isInitializing) return;

    this.isInitializing = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch (err) {
      console.error('Failed to initialize PoseLandmarker:', err);
      throw new Error(
        'Failed to initialize pose detection. Please check your internet connection for the initial model download.'
      );
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Process a single video frame for pose detection.
   * @param videoElement - The video element to process
   * @param timestamp - Current timestamp in ms (must be strictly increasing)
   * @returns Detection results or null if no pose found
   */
  detectForVideo(
    videoElement: HTMLVideoElement,
    timestamp: number
  ): {
    landmarks: NormalizedLandmark[];
    worldLandmarks: NormalizedLandmark[];
  } | null {
    if (!this.poseLandmarker) return null;
    if (videoElement.readyState < 2) return null;

    // Ensure strictly increasing timestamps
    const ts = timestamp <= this.lastTimestamp ? this.lastTimestamp + 1 : timestamp;
    this.lastTimestamp = ts;

    try {
      const result = this.poseLandmarker.detectForVideo(videoElement, ts);

      if (result.landmarks && result.landmarks.length > 0) {
        // Convert to our Landmark type (MediaPipe already returns compatible format)
        const landmarks = result.landmarks[0] as NormalizedLandmark[];
        const worldLandmarks = (result.worldLandmarks?.[0] ?? result.landmarks[0]) as NormalizedLandmark[];
        return { landmarks, worldLandmarks };
      }
    } catch (err) {
      // Silently handle detection errors (frame skip)
      console.debug('Pose detection frame error:', err);
    }

    return null;
  }

  /**
   * Check if the detector is ready.
   */
  get isReady(): boolean {
    return this.poseLandmarker !== null;
  }

  /**
   * Clean up resources.
   */
  async dispose(): Promise<void> {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
    this.lastTimestamp = -1;
  }
}

/** Shared singleton instance */
export const poseDetector = new PoseDetector();
