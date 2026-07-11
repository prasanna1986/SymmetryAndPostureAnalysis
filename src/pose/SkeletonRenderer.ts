/**
 * SkeletonRenderer — Canvas-based skeleton overlay drawing.
 * Renders joints, bones, and optional labels on a canvas.
 *
 * ACCURACY IMPROVEMENTS:
 * - Bones/joints with visibility 0.55-0.7 are drawn at reduced opacity.
 * - Below 0.55 (or rejected by anatomical validation), they are not drawn at all.
 * - This gives the user immediate visual feedback about what the system can see.
 */

import type { NormalizedLandmark } from '../types';
import { LandmarkIndex } from '../types';
import {
  SKELETON_CONNECTIONS,
  LANDMARK_LABELS,
  KEY_LANDMARKS,
  MIN_VISIBILITY,
  getLandmarkColor,
} from './landmarkConstants';

export interface SkeletonRenderOptions {
  /** Whether to draw joint circles */
  showJoints?: boolean;
  /** Whether to draw bone lines */
  showBones?: boolean;
  /** Whether to draw landmark labels */
  showLabels?: boolean;
  /** Joint circle radius in pixels */
  jointRadius?: number;
  /** Bone line width in pixels */
  boneWidth?: number;
  /** Label font size */
  labelSize?: number;
  /** Overall opacity (0-1) */
  opacity?: number;
  /** Per-landmark availability flags from the filter pipeline */
  available?: boolean[];
}

const DEFAULT_OPTIONS: Required<Omit<SkeletonRenderOptions, 'available'>> & { available?: boolean[] } = {
  showJoints: true,
  showBones: true,
  showLabels: false,
  jointRadius: 5,
  boneWidth: 2.5,
  labelSize: 10,
  opacity: 1,
  available: undefined,
};

/**
 * Map landmark visibility to a rendering opacity.
 * - visibility >= 0.75: full opacity (1.0)
 * - visibility 0.55-0.75: partial opacity (0.3-0.8)
 * - visibility < 0.55: hidden (0.0)
 *
 * If the `available` array is provided and marks this landmark as unavailable
 * (e.g., rejected by anatomical validation), opacity is 0.
 */
function landmarkOpacity(
  visibility: number,
  index: number,
  available?: boolean[]
): number {
  if (available && !available[index]) return 0;
  if (visibility < MIN_VISIBILITY) return 0;
  if (visibility >= 0.75) return 1.0;
  // Linear interpolation between 0.3 and 0.8 for visibility 0.55-0.75
  const t = (visibility - MIN_VISIBILITY) / (0.75 - MIN_VISIBILITY);
  return 0.3 + t * 0.5;
}

/**
 * Renders a skeleton overlay on a canvas element.
 */
export class SkeletonRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context from canvas');
    this.ctx = ctx;
  }

  /**
   * Clear the canvas.
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Resize canvas to match the video dimensions.
   */
  resize(width: number, height: number): void {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  /**
   * Render the full skeleton from landmarks.
   */
  render(landmarks: NormalizedLandmark[], options?: SkeletonRenderOptions): void {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.clear();
    this.ctx.globalAlpha = opts.opacity;

    // Draw bones first (behind joints)
    if (opts.showBones) {
      this.drawBones(landmarks, w, h, opts);
    }

    // Draw joints
    if (opts.showJoints) {
      this.drawJoints(landmarks, w, h, opts);
    }

    // Draw labels
    if (opts.showLabels) {
      this.drawLabels(landmarks, w, h, opts);
    }

    this.ctx.globalAlpha = 1;
  }

  private drawBones(
    landmarks: NormalizedLandmark[],
    w: number,
    h: number,
    opts: typeof DEFAULT_OPTIONS
  ): void {
    for (const [startIdx, endIdx] of SKELETON_CONNECTIONS) {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (!start || !end) continue;

      // Compute opacity for each endpoint
      const startOpacity = landmarkOpacity(start.visibility, startIdx, opts.available);
      const endOpacity = landmarkOpacity(end.visibility, endIdx, opts.available);

      // Skip bone entirely if either endpoint is invisible
      if (startOpacity <= 0 || endOpacity <= 0) continue;

      // Use the minimum opacity of both endpoints
      const boneOpacity = Math.min(startOpacity, endOpacity);

      const x1 = start.x * w;
      const y1 = start.y * h;
      const x2 = end.x * w;
      const y2 = end.y * h;

      // Gradient bone color based on which side
      const color1 = getLandmarkColor(startIdx);
      const color2 = getLandmarkColor(endIdx);

      this.ctx.save();
      this.ctx.globalAlpha = boneOpacity * opts.opacity;

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);

      if (color1 === color2) {
        this.ctx.strokeStyle = color1;
      } else {
        const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        this.ctx.strokeStyle = gradient;
      }

      this.ctx.lineWidth = opts.boneWidth;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();

      this.ctx.restore();
    }
  }

  private drawJoints(
    landmarks: NormalizedLandmark[],
    w: number,
    h: number,
    opts: typeof DEFAULT_OPTIONS
  ): void {
    landmarks.forEach((lm, index) => {
      const opacity = landmarkOpacity(lm.visibility, index, opts.available);
      if (opacity <= 0) return;

      const x = lm.x * w;
      const y = lm.y * h;
      const color = getLandmarkColor(index as LandmarkIndex);

      this.ctx.save();
      this.ctx.globalAlpha = opacity * opts.opacity;

      // Outer glow
      this.ctx.beginPath();
      this.ctx.arc(x, y, opts.jointRadius + 2, 0, Math.PI * 2);
      this.ctx.fillStyle = color + '30';
      this.ctx.fill();

      // Inner solid
      this.ctx.beginPath();
      this.ctx.arc(x, y, opts.jointRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();

      // Center dot
      this.ctx.beginPath();
      this.ctx.arc(x, y, opts.jointRadius * 0.4, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();

      this.ctx.restore();
    });
  }

  private drawLabels(
    landmarks: NormalizedLandmark[],
    w: number,
    h: number,
    opts: typeof DEFAULT_OPTIONS
  ): void {
    this.ctx.font = `${opts.labelSize}px Inter, sans-serif`;
    this.ctx.textAlign = 'left';

    for (const index of KEY_LANDMARKS) {
      const lm = landmarks[index];
      if (!lm) continue;

      const opacity = landmarkOpacity(lm.visibility, index, opts.available);
      if (opacity <= 0) continue;

      const label = LANDMARK_LABELS[index];
      if (!label) continue;

      const x = lm.x * w + opts.jointRadius + 4;
      const y = lm.y * h + opts.labelSize * 0.35;

      this.ctx.save();
      this.ctx.globalAlpha = opacity * opts.opacity;

      // Background
      const metrics = this.ctx.measureText(label);
      const pad = 3;
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this.ctx.fillRect(
        x - pad,
        y - opts.labelSize + pad,
        metrics.width + pad * 2,
        opts.labelSize + pad
      );

      // Text
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      this.ctx.fillText(label, x, y);

      this.ctx.restore();
    }
  }
}
