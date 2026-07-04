/**
 * Camera and device types.
 */

/** A detected camera device */
export interface CameraDevice {
  /** Device ID for getUserMedia */
  deviceId: string;
  /** Human-readable device label */
  label: string;
  /** Device group ID */
  groupId: string;
}

/** Camera stream configuration */
export interface CameraConfig {
  /** Target width */
  width: number;
  /** Target height */
  height: number;
  /** Target frame rate */
  frameRate: number;
  /** Facing mode for mobile */
  facingMode: 'user' | 'environment';
}

/** Camera permission state */
export type CameraPermission = 'prompt' | 'granted' | 'denied' | 'unavailable';
