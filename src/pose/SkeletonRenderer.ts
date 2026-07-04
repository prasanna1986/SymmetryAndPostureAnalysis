/**
 * SkeletonRenderer — Canvas-based skeleton overlay drawing.
 * Renders joints, bones, and optional labels on a canvas.
 */

import type { NormalizedLandmark } from '../types';
import { LandmarkIndex } from '../types';
import {
  SKELETON_CONNECTIONS,
  LANDMARK_LABELS,
  KEY_LANDMARKS,
  MIN_VISIBILITY,
  getLandmarkColor,
  LEFT_COLOR,
  RIGHT_COLOR,
  CENTER_COLOR,
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
}

const DEFAULT_OPTIONS: Required<SkeletonRenderOptions> = {
  showJoints: true,
  showBones: true,
  showLabels: false,
  jointRadius: 5,
  boneWidth: 2.5,
  labelSize: 10,
  opacity: 1,
};

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
    opts: Required<SkeletonRenderOptions>
  ): void {
    for (const [startIdx, endIdx] of SKELETON_CONNECTIONS) {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (!start || !end) continue;
      if (start.visibility < MIN_VISIBILITY || end.visibility < MIN_VISIBILITY) continue;

      const x1 = start.x * w;
      const y1 = start.y * h;
      const x2 = end.x * w;
      const y2 = end.y * h;

      // Gradient bone color based on which side
      const color1 = getLandmarkColor(startIdx);
      const color2 = getLandmarkColor(endIdx);

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
    }
  }

  private drawJoints(
    landmarks: NormalizedLandmark[],
    w: number,
    h: number,
    opts: Required<SkeletonRenderOptions>
  ): void {
    landmarks.forEach((lm, index) => {
      if (lm.visibility < MIN_VISIBILITY) return;

      const x = lm.x * w;
      const y = lm.y * h;
      const color = getLandmarkColor(index as LandmarkIndex);

      // Outer glow
      this.ctx.beginPath();
      this.ctx.arc(x, y, opts.jointRadius + 2, 0, Math.PI * 2);
      this.ctx.fillStyle = color + '30'; // 30 = ~19% opacity hex
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
    });
  }

  private drawLabels(
    landmarks: NormalizedLandmark[],
    w: number,
    h: number,
    opts: Required<SkeletonRenderOptions>
  ): void {
    this.ctx.font = `${opts.labelSize}px Inter, sans-serif`;
    this.ctx.textAlign = 'left';

    for (const index of KEY_LANDMARKS) {
      const lm = landmarks[index];
      if (!lm || lm.visibility < MIN_VISIBILITY) continue;

      const label = LANDMARK_LABELS[index];
      if (!label) continue;

      const x = lm.x * w + opts.jointRadius + 4;
      const y = lm.y * h + opts.labelSize * 0.35;

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
    }
  }
}
