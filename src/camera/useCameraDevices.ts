/**
 * Hook for enumerating available camera devices.
 */

import { useCallback, useEffect } from 'react';
import { useCameraStore } from '../stores/cameraStore';
import type { CameraDevice } from '../types';

/**
 * Enumerates available video input devices and tracks permission state.
 */
export function useCameraDevices() {
  const { devices, permission, setDevices, setPermission, setError } = useCameraStore();

  const enumerateDevices = useCallback(async () => {
    try {
      // Check if media devices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setPermission('unavailable');
        setError('Camera API is not available in this browser.');
        return;
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices: CameraDevice[] = allDevices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
          groupId: d.groupId,
        }));

      setDevices(videoDevices);

      // If we got labels, permission was already granted
      if (videoDevices.length > 0 && videoDevices[0].label && videoDevices[0].label !== 'Camera 1') {
        setPermission('granted');
      }
    } catch (err) {
      console.error('Failed to enumerate devices:', err);
      setError('Failed to access camera devices.');
    }
  }, [setDevices, setPermission, setError]);

  const requestPermission = useCallback(async () => {
    try {
      // Request a temporary stream to trigger permission dialog
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the temporary stream immediately
      tempStream.getTracks().forEach((track) => track.stop());
      setPermission('granted');
      // Re-enumerate to get proper labels
      await enumerateDevices();
    } catch (err) {
      const error = err as DOMException;
      if (error.name === 'NotAllowedError') {
        setPermission('denied');
        setError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setPermission('unavailable');
        setError('No camera found. Please connect a webcam.');
      } else {
        setError(`Camera error: ${error.message}`);
      }
    }
  }, [enumerateDevices, setPermission, setError]);

  // Enumerate devices on mount
  useEffect(() => {
    enumerateDevices();

    // Listen for device changes (camera plugged in/out)
    const handler = () => enumerateDevices();
    navigator.mediaDevices?.addEventListener('devicechange', handler);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handler);
    };
  }, [enumerateDevices]);

  return {
    devices,
    permission,
    enumerateDevices,
    requestPermission,
  };
}
