/**
 * Hook for managing camera stream lifecycle.
 */

import { useCallback, useRef } from 'react';
import { useCameraStore } from '../stores/cameraStore';

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: 'user',
  },
  audio: false,
};

/**
 * Manages starting/stopping the camera MediaStream.
 */
export function useCameraStream() {
  const {
    isStreaming,
    selectedDeviceId,
    stream,
    setStreaming,
    setStream,
    setPermission,
    setError,
    setFps,
  } = useCameraStore();

  const fpsIntervalRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);

  /**
   * Start the camera stream with the selected device.
   */
  const startCamera = useCallback(
    async (videoElement: HTMLVideoElement) => {
      try {
        // Stop any existing stream
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          ...DEFAULT_CONSTRAINTS,
          video: {
            ...(DEFAULT_CONSTRAINTS.video as MediaTrackConstraints),
            ...(selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : {}),
          },
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        setPermission('granted');
        setError(null);

        // Set the stream on the video element
        videoElement.srcObject = newStream;
        await videoElement.play();

        setStreaming(true);

        // Start FPS counter
        frameCountRef.current = 0;
        if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
        fpsIntervalRef.current = window.setInterval(() => {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
        }, 1000);

        return newStream;
      } catch (err) {
        const error = err as DOMException;
        if (error.name === 'NotAllowedError') {
          setPermission('denied');
          setError('Camera access denied. Please enable camera in browser settings.');
        } else if (error.name === 'NotFoundError') {
          setError('No camera found. Please connect a webcam.');
        } else if (error.name === 'NotReadableError') {
          setError('Camera is in use by another application.');
        } else {
          setError(`Failed to start camera: ${error.message}`);
        }
        setStreaming(false);
        return null;
      }
    },
    [selectedDeviceId, stream, setStream, setStreaming, setPermission, setError, setFps]
  );

  /**
   * Stop the camera stream.
   */
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setStreaming(false);
    setFps(0);

    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
      fpsIntervalRef.current = null;
    }
  }, [stream, setStream, setStreaming, setFps]);

  /**
   * Increment frame count (called from render loop).
   */
  const countFrame = useCallback(() => {
    frameCountRef.current++;
  }, []);

  return {
    isStreaming,
    startCamera,
    stopCamera,
    countFrame,
  };
}
