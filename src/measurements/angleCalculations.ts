/**
 * Angle and distance calculation utilities for biomechanical analysis.
 * All angle results are in degrees.
 */

import type { NormalizedLandmark } from '../types';

/** Convert radians to degrees */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/** Convert degrees to radians */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the angle at vertex B formed by points A-B-C.
 * Returns angle in degrees (0-180).
 */
export function angleBetweenPoints(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

  const dotProduct = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

  if (magBA === 0 || magBC === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dotProduct / (magBA * magBC)));
  return toDegrees(Math.acos(cosAngle));
}

/**
 * Calculate the angle of line A→B relative to horizontal (positive X axis).
 * Returns angle in degrees (-180 to 180).
 */
export function angleToHorizontal(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return toDegrees(Math.atan2(b.y - a.y, b.x - a.x));
}

/**
 * Calculate the angle of line A→B relative to vertical (positive Y down in screen space).
 * Returns angle in degrees. 0 = perfectly vertical down.
 */
export function angleToVertical(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Angle from vertical (Y-axis down)
  return toDegrees(Math.atan2(dx, dy));
}

/**
 * Calculate Euclidean distance between two 2D points (ignoring Z).
 */
export function distance2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/**
 * Calculate Euclidean distance between two 3D points.
 */
export function distance3D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2 + (b.z - a.z) ** 2);
}

/**
 * Calculate the midpoint between two landmarks.
 */
export function midpoint(a: NormalizedLandmark, b: NormalizedLandmark): NormalizedLandmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility, b.visibility),
  };
}

/**
 * Calculate the minimum visibility (confidence) across multiple landmarks.
 */
export function minVisibility(...landmarks: NormalizedLandmark[]): number {
  return Math.min(...landmarks.map((l) => l.visibility));
}

/**
 * Calculate the average visibility across landmarks.
 */
export function avgVisibility(...landmarks: NormalizedLandmark[]): number {
  if (landmarks.length === 0) return 0;
  return landmarks.reduce((sum, l) => sum + l.visibility, 0) / landmarks.length;
}

/**
 * Calculate the lateral (horizontal) displacement between two points,
 * normalized by a reference distance (e.g., shoulder width).
 * Positive = point B is to the right of point A.
 */
export function lateralDisplacement(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  referenceWidth: number
): number {
  if (referenceWidth === 0) return 0;
  return (b.x - a.x) / referenceWidth;
}

/**
 * Calculate the vertical displacement between two points,
 * normalized by a reference height.
 * Positive = point B is below point A (screen coordinates).
 */
export function verticalDisplacement(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  referenceHeight: number
): number {
  if (referenceHeight === 0) return 0;
  return (b.y - a.y) / referenceHeight;
}

/**
 * Calculate how much a point deviates from a line formed by two other points.
 * Returns the perpendicular distance normalized by the line length.
 */
export function deviationFromLine(
  point: NormalizedLandmark,
  lineStart: NormalizedLandmark,
  lineEnd: NormalizedLandmark
): number {
  const lineLen = distance2D(lineStart, lineEnd);
  if (lineLen === 0) return 0;

  // Perpendicular distance using cross product
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const cross = Math.abs(dx * (lineStart.y - point.y) - (lineStart.x - point.x) * dy);
  return cross / lineLen;
}
