/**
 * Main pose detection loop hook.
 * Only runs assessment scoring during the 'recording' phase.
 * Runs readiness checks during 'preparing' phase.
 */

import { useCallback, useEffect, useRef } from 'react';
import { poseDetector } from '../pose/PoseDetector';
import { SkeletonRenderer } from '../pose/SkeletonRenderer';
import { usePoseStore } from '../stores/poseStore';
import { useCameraStore } from '../stores/cameraStore';
import { useAssessmentStore } from '../stores/assessmentStore';
import { computePostureMetrics, computeOverallScore } from '../measurements/postureMetrics';
import { computeSquatMetrics, computeOverheadReachMetrics, computeForwardBendMetrics } from '../measurements/movementMetrics';
import { runPostureAssessment, runAssessment } from '../assessment/assessmentRunner';
import { generateRecommendations } from '../knowledge/recommendationEngine';
import { checkReadiness } from '../assessment/poseReadiness';
import type { PostureMetrics } from '../types';

interface UsePoseLoopOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  showLabels?: boolean;
  assessmentInterval?: number;
}

export function usePoseLoop({
  videoRef,
  canvasRef,
  showLabels = false,
  assessmentInterval = 10,
}: UsePoseLoopOptions) {
  const animFrameRef = useRef<number>(0);
  const rendererRef = useRef<SkeletonRenderer | null>(null);
  const frameCountRef = useRef(0);
  const fpsCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());

  // Accumulator for averaging metrics during recording
  const metricsAccumRef = useRef<PostureMetrics[]>([]);

  const isStreaming = useCameraStore((s) => s.isStreaming);
  const {
    setLandmarks, setWorldLandmarks, setConfidence, setDetecting,
    setDetectionFps, setInitialized, setLoading, setError,
  } = usePoseStore();
  const {
    activeTest, status, setPostureMetrics, setFindings, setScores,
    setCurrentAssessment, setRecommendations, setConfidence: setAssessmentConfidence,
    incrementFrameCount, setReadiness,
  } = useAssessmentStore();

  // Initialize pose detector
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    poseDetector
      .initialize()
      .then(() => {
        if (!cancelled) { setInitialized(true); setLoading(false); setError(null); }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [setInitialized, setLoading, setError]);

  // Reset accumulator when status changes to recording
  useEffect(() => {
    if (status === 'recording') {
      metricsAccumRef.current = [];
    }
  }, [status]);

  const detect = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !poseDetector.isReady || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    if (!rendererRef.current) {
      rendererRef.current = new SkeletonRenderer(canvas);
    }
    rendererRef.current.resize(video.videoWidth, video.videoHeight);

    const result = poseDetector.detectForVideo(video, performance.now());

    if (result) {
      const { landmarks, worldLandmarks } = result;
      setLandmarks(landmarks);
      setWorldLandmarks(worldLandmarks);

      const avgConf = landmarks.reduce((sum, l) => sum + l.visibility, 0) / landmarks.length;
      setConfidence(avgConf);

      // Skeleton color changes based on status
      const boneColor = status === 'recording' ? '#00e676' : status === 'preparing' ? '#ffab00' : undefined;
      rendererRef.current.render(landmarks, { showLabels, showJoints: true, showBones: true });

      // FPS
      fpsCountRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setDetectionFps(fpsCountRef.current);
        fpsCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      // --- PREPARING: run readiness checks ---
      if (status === 'preparing') {
        const readiness = checkReadiness(landmarks, activeTest);
        setReadiness(readiness.isReady, readiness.message, readiness.stability);
      }

      // --- RECORDING: accumulate metrics ---
      if (status === 'recording') {
        frameCountRef.current++;
        incrementFrameCount();

        try {
          const metrics = computePostureMetrics(landmarks);
          metricsAccumRef.current.push(metrics);
          setPostureMetrics(metrics);

          // Run assessment every N frames for live feedback
          if (frameCountRef.current % assessmentInterval === 0) {
            const avgMetrics = averageMetrics(metricsAccumRef.current);
            let assessment;
            if (activeTest === 'standing_posture') {
              assessment = runPostureAssessment(avgMetrics);
            } else if (activeTest === 'squat') {
              const sq = computeSquatMetrics(landmarks);
              assessment = runAssessment('squat', sq as unknown as Record<string, number>, metrics.confidence, metrics.symmetryScore);
            } else if (activeTest === 'overhead_reach') {
              const or = computeOverheadReachMetrics(landmarks);
              assessment = runAssessment('overhead_reach', or as unknown as Record<string, number>, metrics.confidence, metrics.symmetryScore);
            } else if (activeTest === 'forward_bend') {
              const fb = computeForwardBendMetrics(landmarks);
              assessment = runAssessment('forward_bend', fb as unknown as Record<string, number>, metrics.confidence, metrics.symmetryScore);
            } else if (activeTest === 'free_analysis' || activeTest === 'exercise_form') {
              // Generic: run posture metrics through the free_analysis rules
              const measurements: Record<string, number> = {
                forwardHeadAngle: avgMetrics.forwardHeadAngle,
                shoulderHeightDiff: avgMetrics.shoulderHeightDiff,
                shoulderRotation: avgMetrics.shoulderRotation,
                pelvicTilt: avgMetrics.pelvicTilt,
                hipShift: avgMetrics.hipShift,
                leftKneeAngle: avgMetrics.leftKneeAngle,
                rightKneeAngle: avgMetrics.rightKneeAngle,
                trunkLean: avgMetrics.trunkLean,
                spinalAlignment: avgMetrics.spinalAlignment,
                weightShift: avgMetrics.weightShift,
              };
              assessment = runAssessment(activeTest, measurements, metrics.confidence, metrics.symmetryScore);
            } else {
              assessment = runPostureAssessment(avgMetrics);
            }

            setCurrentAssessment(assessment);
            setFindings(assessment.findings);
            setScores(assessment.overallScore, assessment.symmetryScore);
            setAssessmentConfidence(assessment.confidence);

            const recs = generateRecommendations(assessment.findings, assessment.measurements);
            setRecommendations(recs);
          }
        } catch {
          // skip frame
        }
      }

      // --- IDLE: just show skeleton, no scoring ---
      if (status === 'idle') {
        // Show live posture metrics as preview (non-scored)
        frameCountRef.current++;
        if (frameCountRef.current % 30 === 0) {
          try {
            const metrics = computePostureMetrics(landmarks);
            setPostureMetrics(metrics);
          } catch {
            // skip
          }
        }
      }
    } else {
      rendererRef.current.clear();
    }

    animFrameRef.current = requestAnimationFrame(detect);
  }, [videoRef, canvasRef, showLabels, assessmentInterval, activeTest, status,
    setLandmarks, setWorldLandmarks, setConfidence, setDetectionFps,
    setPostureMetrics, setFindings, setScores, setCurrentAssessment,
    setRecommendations, setAssessmentConfidence, incrementFrameCount, setReadiness]);

  useEffect(() => {
    if (isStreaming && poseDetector.isReady) {
      setDetecting(true);
      animFrameRef.current = requestAnimationFrame(detect);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setDetecting(false);
    };
  }, [isStreaming, detect, setDetecting]);

  return { isReady: poseDetector.isReady };
}

/** Average a list of PostureMetrics into one smoothed result */
function averageMetrics(list: PostureMetrics[]): PostureMetrics {
  if (list.length === 0) throw new Error('No metrics to average');
  if (list.length === 1) return list[0];

  const n = list.length;
  const sum = (key: keyof PostureMetrics) => {
    let total = 0;
    for (const m of list) {
      const v = m[key];
      if (typeof v === 'number') total += v;
    }
    return total / n;
  };

  // Average confidence map
  const confKeys = Object.keys(list[0].confidence);
  const avgConf: Record<string, number> = {};
  for (const k of confKeys) {
    avgConf[k] = list.reduce((s, m) => s + (m.confidence[k] ?? 0), 0) / n;
  }

  return {
    forwardHeadAngle: sum('forwardHeadAngle'),
    shoulderHeightDiff: sum('shoulderHeightDiff'),
    shoulderRotation: sum('shoulderRotation'),
    pelvicTilt: sum('pelvicTilt'),
    pelvicRotation: sum('pelvicRotation'),
    hipShift: sum('hipShift'),
    leftKneeAngle: sum('leftKneeAngle'),
    rightKneeAngle: sum('rightKneeAngle'),
    trunkLean: sum('trunkLean'),
    spinalAlignment: sum('spinalAlignment'),
    weightShift: sum('weightShift'),
    symmetryScore: sum('symmetryScore'),
    confidence: avgConf,
  };
}
