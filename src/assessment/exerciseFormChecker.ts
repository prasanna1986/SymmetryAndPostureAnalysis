/**
 * Exercise form checker — uses LLM + pose landmarks to evaluate
 * whether an exercise is being performed with good form.
 * Works for any exercise, live or from recorded video.
 */

import type { NormalizedLandmark } from '../types';
import { LandmarkIndex } from '../types';
import { angleBetweenPoints, angleToVertical, midpoint, distance2D } from '../measurements/angleCalculations';

export interface FormCheckResult {
  /** Summary of joint angles and positions */
  poseSummary: string;
  /** Whether the pose appears to be an exercise (vs. idle) */
  isExercising: boolean;
  /** Detected general movement pattern */
  movementPattern: string;
}

/**
 * Extract a human-readable summary of the current pose for LLM analysis.
 * This gives the LLM structured data about joint angles without sending images.
 */
export function extractPoseSummary(landmarks: NormalizedLandmark[]): FormCheckResult {
  const lShoulder = landmarks[LandmarkIndex.LEFT_SHOULDER];
  const rShoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER];
  const lElbow = landmarks[LandmarkIndex.LEFT_ELBOW];
  const rElbow = landmarks[LandmarkIndex.RIGHT_ELBOW];
  const lWrist = landmarks[LandmarkIndex.LEFT_WRIST];
  const rWrist = landmarks[LandmarkIndex.RIGHT_WRIST];
  const lHip = landmarks[LandmarkIndex.LEFT_HIP];
  const rHip = landmarks[LandmarkIndex.RIGHT_HIP];
  const lKnee = landmarks[LandmarkIndex.LEFT_KNEE];
  const rKnee = landmarks[LandmarkIndex.RIGHT_KNEE];
  const lAnkle = landmarks[LandmarkIndex.LEFT_ANKLE];
  const rAnkle = landmarks[LandmarkIndex.RIGHT_ANKLE];
  const nose = landmarks[LandmarkIndex.NOSE];

  const shoulderMid = midpoint(lShoulder, rShoulder);
  const hipMid = midpoint(lHip, rHip);

  // Key angles
  const lShoulderAngle = angleBetweenPoints(lHip, lShoulder, lElbow);
  const rShoulderAngle = angleBetweenPoints(rHip, rShoulder, rElbow);
  const lElbowAngle = angleBetweenPoints(lShoulder, lElbow, lWrist);
  const rElbowAngle = angleBetweenPoints(rShoulder, rElbow, rWrist);
  const lHipAngle = angleBetweenPoints(lShoulder, lHip, lKnee);
  const rHipAngle = angleBetweenPoints(rShoulder, rHip, rKnee);
  const lKneeAngle = angleBetweenPoints(lHip, lKnee, lAnkle);
  const rKneeAngle = angleBetweenPoints(rHip, rKnee, rAnkle);
  const trunkAngle = Math.abs(angleToVertical(hipMid, shoulderMid));

  // Detect movement pattern
  let movementPattern = 'standing';
  const avgKnee = (lKneeAngle + rKneeAngle) / 2;
  const avgHip = (lHipAngle + rHipAngle) / 2;
  const avgShoulder = (lShoulderAngle + rShoulderAngle) / 2;
  const armsUp = lWrist.y < lShoulder.y && rWrist.y < rShoulder.y;

  if (avgKnee < 140 && avgHip < 140) {
    movementPattern = 'squat or sitting';
  } else if (trunkAngle > 40) {
    movementPattern = 'bending forward';
  } else if (armsUp && avgShoulder > 140) {
    movementPattern = 'arms overhead / pressing';
  } else if (armsUp) {
    movementPattern = 'arms raised';
  } else if (lWrist.y < lElbow.y || rWrist.y < rElbow.y) {
    movementPattern = 'arm exercise (curl/raise)';
  }

  // Check if actively exercising (not just standing idle)
  const isExercising = movementPattern !== 'standing';

  const poseSummary = [
    `Movement pattern: ${movementPattern}`,
    `Trunk angle from vertical: ${trunkAngle.toFixed(1)}°`,
    `Left shoulder flexion: ${lShoulderAngle.toFixed(1)}° | Right: ${rShoulderAngle.toFixed(1)}°`,
    `Left elbow angle: ${lElbowAngle.toFixed(1)}° | Right: ${rElbowAngle.toFixed(1)}°`,
    `Left hip angle: ${lHipAngle.toFixed(1)}° | Right: ${rHipAngle.toFixed(1)}°`,
    `Left knee angle: ${lKneeAngle.toFixed(1)}° | Right: ${rKneeAngle.toFixed(1)}°`,
    `Arms above shoulders: ${armsUp ? 'yes' : 'no'}`,
    `Head position relative to shoulders: ${nose.y < shoulderMid.y ? 'above' : 'level/below'}`,
  ].join('\n');

  return { poseSummary, isExercising, movementPattern };
}

/**
 * Build the LLM prompt for exercise form evaluation.
 */
export function buildFormCheckPrompt(poseSummary: string, exerciseName?: string): string {
  const exerciseContext = exerciseName
    ? `The person is attempting to perform: "${exerciseName}".`
    : `Identify what exercise or movement the person appears to be doing.`;

  return `You are an expert exercise form coach. Based on the following body position data (joint angles measured from pose landmarks), evaluate the exercise form.

${exerciseContext}

Body position data:
${poseSummary}

Provide a brief assessment (under 120 words):
1. What exercise/movement this appears to be
2. What looks good about their form
3. What could be improved (be specific about joint angles or positions)
4. One key tip for better form

Rules:
- Be encouraging and constructive
- Use specific angle references when relevant
- Do NOT diagnose injuries or pain
- Focus on observable movement quality`;
}
