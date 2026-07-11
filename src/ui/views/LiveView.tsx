/**
 * LiveView — main assessment view with guided assessment flow.
 * Supports all test types including Free Analysis and Exercise Form Check.
 * Flow: idle → Begin → preparing (readiness) → countdown → recording → analyzing (LLM) → complete
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { CameraView } from '../../camera/CameraView';
import { usePoseLoop } from '../../hooks/usePoseLoop';
import { usePoseStore } from '../../stores/poseStore';
import { useCameraStore } from '../../stores/cameraStore';
import { useAssessmentStore } from '../../stores/assessmentStore';
import { useSessionStore } from '../../stores/sessionStore';
import { TestSelector } from '../components/TestSelector';
import { MovementScore } from '../components/MovementScore';
import { MetricsPanel } from '../components/MetricsPanel';
import { FindingsList } from '../components/AssessmentCard';
import { RecommendationPanel } from '../components/RecommendationPanel';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { testLabels } from '../../assessment/assessmentRunner';
import { saveSession } from '../../storage/sessionStorage';
import { generateLLMSummary } from '../../knowledge/lmStudioIntegration';
import { resetStabilityTracking } from '../../assessment/poseReadiness';
import { extractPoseSummary, buildFormCheckPrompt } from '../../assessment/exerciseFormChecker';
import type { Session } from '../../types';

const COUNTDOWN_SECONDS = 3;
const RECORDING_SECONDS = 5;

export const LiveView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  const [exerciseName, setExerciseName] = useState('');
  const [formCheckResult, setFormCheckResult] = useState<string | null>(null);
  const [formCheckLoading, setFormCheckLoading] = useState(false);

  const { detectionFps, confidenceLevel, confidence, isLoading, landmarks } = usePoseStore();
  const isStreaming = useCameraStore((s) => s.isStreaming);
  const {
    activeTest, setActiveTest, status, setStatus, overallScore, symmetryScore,
    postureMetrics, findings, recommendations, currentAssessment,
    countdown, setCountdown, recordingElapsed, setRecordingElapsed,
    readinessMessage, isReady, stability, resetAssessment,
    llmSummary, llmLoading, setLlmSummary, setLlmLoading,
  } = useAssessmentStore();
  const { addSession } = useSessionStore();

  // Reset assessment if the camera is stopped
  useEffect(() => {
    if (!isStreaming) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      resetAssessment();
    }
  }, [isStreaming, resetAssessment]);

  const { getFilteredResult } = usePoseLoop({ videoRef, canvasRef, showLabels: false, assessmentInterval: 8 });

  // Body visibility state (updated from filtered result)
  const [bodySummary, setBodySummary] = useState('Waiting for camera...');
  const [bodySegCount, setBodySegCount] = useState(0);
  useEffect(() => {
    if (!isStreaming) {
      setBodySummary('Waiting for camera...');
      setBodySegCount(0);
      return;
    }
    const interval = setInterval(() => {
      const filtered = getFilteredResult();
      if (filtered) {
        setBodySummary(filtered.bodyVisibility.summary);
        setBodySegCount(filtered.bodyVisibility.visibleCount);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isStreaming, getFilteredResult]);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const handleBeginAssessment = useCallback(() => {
    resetAssessment();
    resetStabilityTracking();
    setFormCheckResult(null);

    // For exercise form check and free analysis, skip readiness — start countdown immediately
    if (activeTest === 'exercise_form' || activeTest === 'free_analysis') {
      setCountdown(COUNTDOWN_SECONDS);
      let remaining = COUNTDOWN_SECONDS;
      countdownTimerRef.current = window.setInterval(() => {
        remaining--;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(countdownTimerRef.current!);
          countdownTimerRef.current = null;
          setStatus('recording');
          setRecordingElapsed(0);
          let elapsed = 0;
          recordingTimerRef.current = window.setInterval(() => {
            elapsed++;
            setRecordingElapsed(elapsed);
            if (elapsed >= RECORDING_SECONDS) {
              clearInterval(recordingTimerRef.current!);
              recordingTimerRef.current = null;
              setStatus('analyzing');
            }
          }, 1000);
        }
      }, 1000);
      setStatus('preparing');
    } else {
      setStatus('preparing');
    }
  }, [resetAssessment, activeTest, setCountdown, setStatus, setRecordingElapsed]);

  // Auto-start countdown when ready during 'preparing' (for structured tests)
  useEffect(() => {
    if (status !== 'preparing' || !isReady) return;
    if (activeTest === 'exercise_form' || activeTest === 'free_analysis') return; // already handled

    const readyTimeout = setTimeout(() => {
      if (useAssessmentStore.getState().isReady && useAssessmentStore.getState().status === 'preparing') {
        setCountdown(COUNTDOWN_SECONDS);
        let remaining = COUNTDOWN_SECONDS;
        countdownTimerRef.current = window.setInterval(() => {
          remaining--;
          setCountdown(remaining);
          if (remaining <= 0) {
            clearInterval(countdownTimerRef.current!);
            countdownTimerRef.current = null;
            setStatus('recording');
            setRecordingElapsed(0);
            let elapsed = 0;
            recordingTimerRef.current = window.setInterval(() => {
              elapsed++;
              setRecordingElapsed(elapsed);
              if (elapsed >= RECORDING_SECONDS) {
                clearInterval(recordingTimerRef.current!);
                recordingTimerRef.current = null;
                setStatus('analyzing');
              }
            }, 1000);
          }
        }, 1000);
      }
    }, 800);
    return () => clearTimeout(readyTimeout);
  }, [status, isReady, activeTest, setCountdown, setStatus, setRecordingElapsed]);

  // When 'analyzing': run LLM for form check or regular summary
  useEffect(() => {
    if (status !== 'analyzing') return;

    const doAnalyze = async () => {
      if (activeTest === 'exercise_form' && landmarks) {
        // Exercise form check via LLM
        setFormCheckLoading(true);
        try {
          const { poseSummary, movementPattern } = extractPoseSummary(landmarks);
          const prompt = buildFormCheckPrompt(poseSummary, exerciseName || undefined);

          const res = await fetch('http://localhost:1234/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(30000),
            body: JSON.stringify({
              model: 'openai/gpt-oss-20b',
              messages: [
                { role: 'system', content: 'You are an expert exercise form coach. Provide specific, constructive feedback on exercise technique based on body position data.' },
                { role: 'user', content: prompt },
              ],
              temperature: 0.7,
              max_tokens: 400,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setFormCheckResult(data.choices?.[0]?.message?.content?.trim() || 'Unable to evaluate form.');
          } else {
            setFormCheckResult('LLM service unavailable. Make sure LM Studio is running on port 1234.');
          }
        } catch {
          setFormCheckResult('Could not reach LM Studio. Check that it is running at localhost:1234.');
        }
        setFormCheckLoading(false);
        setStatus('complete');
      } else {
        // Regular assessment — generate LLM summary
        setLlmLoading(true);
        try {
          const summary = await generateLLMSummary(findings, recommendations, overallScore, symmetryScore);
          setLlmSummary(summary);
        } catch {
          setLlmSummary(null);
        }
        setLlmLoading(false);
        setStatus('complete');
      }
    };
    doAnalyze();
  }, [status, activeTest, landmarks, exerciseName, findings, recommendations, overallScore, symmetryScore, setLlmSummary, setLlmLoading, setStatus]);

  const handleCancelAssessment = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    resetAssessment();
    setFormCheckResult(null);
  }, [resetAssessment]);

  const handleSaveSession = useCallback(async () => {
    if (!currentAssessment || !postureMetrics) return;
    const session: Session = {
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: Date.now(),
      testType: activeTest,
      testLabel: testLabels[activeTest],
      measurements: postureMetrics,
      assessment: currentAssessment,
      overallScore, symmetryScore,
      duration: RECORDING_SECONDS,
    };
    try {
      await saveSession(session);
      addSession({
        id: session.id, date: session.date, testType: session.testType,
        testLabel: session.testLabel, overallScore: session.overallScore,
        symmetryScore: session.symmetryScore, findingsCount: session.assessment.findings.length,
      });
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  }, [currentAssessment, postureMetrics, activeTest, overallScore, symmetryScore, addSession]);

  const statusConfig = {
    idle: { color: 'var(--color-text-muted)', text: 'Ready to assess', bg: 'transparent' },
    preparing: { color: 'var(--color-accent-amber)', text: readinessMessage || 'Getting ready...', bg: 'var(--color-accent-amber-dim)' },
    recording: { color: 'var(--color-accent-emerald)', text: `Recording... ${recordingElapsed}/${RECORDING_SECONDS}s`, bg: 'var(--color-accent-emerald-dim)' },
    analyzing: { color: 'var(--color-accent-violet)', text: 'Generating report...', bg: 'var(--color-accent-violet-dim)' },
    complete: { color: 'var(--color-accent-cyan)', text: 'Assessment complete', bg: 'var(--color-accent-cyan-dim)' },
  };
  const sc = statusConfig[status];

  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1rem', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
        <TestSelector activeTest={activeTest} onSelect={(t) => { if (status === 'idle' || status === 'complete') { handleCancelAssessment(); setActiveTest(t); } }} />

        {/* Exercise name input (for exercise_form mode) */}
        {activeTest === 'exercise_form' && (
          <div className="glass-card-static" style={{ padding: '0.75rem' }}>
            <label style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.375rem' }}>
              Exercise Name (optional)
            </label>
            <input
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g., Bicep Curl, Squat..."
              style={{
                width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem',
                color: 'var(--color-text-primary)', background: 'var(--color-bg-glass)',
                border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)',
                outline: 'none',
              }}
            />
            <p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Leave blank to auto-detect
            </p>
          </div>
        )}

        {/* Scores */}
        <div className="glass-card-static" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <MovementScore score={overallScore} label="Score" size={90} />
          <MovementScore score={symmetryScore} label="Symmetry" size={72} color="var(--color-accent-violet)" />
          <ConfidenceBadge confidence={confidenceLevel} value={confidence} />
        </div>

        {/* Assessment control buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {(status === 'idle' || status === 'complete') && isStreaming && (
            <button className="btn-primary" onClick={handleBeginAssessment} style={{ width: '100%' }}>
              🎯 {status === 'complete' ? 'New Assessment' : activeTest === 'exercise_form' ? 'Check My Form' : 'Begin Assessment'}
            </button>
          )}
          {(status === 'preparing' || status === 'recording' || status === 'analyzing') && (
            <button className="btn-secondary" onClick={handleCancelAssessment} style={{ width: '100%', color: 'var(--color-severity-significant)' }}>
              ✕ Cancel {status === 'analyzing' ? 'Analysis' : ''}
            </button>
          )}
          {status === 'complete' && currentAssessment && (
            <button className="btn-secondary" onClick={handleSaveSession} style={{ width: '100%' }}>
              💾 Save Session
            </button>
          )}
        </div>
      </div>

      {/* Center — Camera feed */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isLoading && (
          <div className="glass-card-static animate-fade-in" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-accent-cyan)' }}>
            <span className="animate-spin" style={{ display: 'inline-block' }}>⏳</span> Loading pose detection model (full accuracy)...
          </div>
        )}

        {/* Body visibility indicator */}
        {isStreaming && (
          <div style={{
            padding: '0.375rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: bodySegCount >= 8 ? 'rgba(0,230,118,0.08)' : bodySegCount >= 4 ? 'rgba(255,171,0,0.08)' : 'rgba(255,82,82,0.08)',
            border: `1px solid ${bodySegCount >= 8 ? 'rgba(0,230,118,0.25)' : bodySegCount >= 4 ? 'rgba(255,171,0,0.25)' : 'rgba(255,82,82,0.25)'}`,
            borderRadius: 'var(--radius-md)', fontSize: '0.75rem', fontWeight: 500,
            color: bodySegCount >= 8 ? 'var(--color-accent-emerald)' : bodySegCount >= 4 ? 'var(--color-accent-amber)' : 'var(--color-severity-significant)',
          }}>
            <span>{bodySegCount >= 8 ? '🟢' : bodySegCount >= 4 ? '🟡' : '🔴'}</span>
            <span>{bodySummary}</span>
            <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: '0.6875rem' }}>
              {bodySegCount}/9 segments
            </span>
          </div>
        )}

        {/* Status bar */}
        {status !== 'idle' && (
          <div className="animate-fade-in" style={{
            padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: sc.bg, border: `1px solid ${sc.color}30`, borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem', color: sc.color, fontWeight: 600,
          }}>
            <span>{status === 'preparing' && countdown > 0 ? `Starting in ${countdown}...` : sc.text}</span>
            {status === 'preparing' && activeTest !== 'exercise_form' && activeTest !== 'free_analysis' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${stability * 100}%`, height: '100%', background: sc.color, borderRadius: '2px', transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>Stability</span>
              </div>
            )}
            {status === 'recording' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: sc.color, display: 'inline-block' }} />
                <span style={{ fontSize: '0.6875rem' }}>REC</span>
              </div>
            )}
            {status === 'analyzing' && <span className="animate-spin" style={{ display: 'inline-block', fontSize: '1rem' }}>🤖</span>}
          </div>
        )}

        {/* Camera with countdown overlay */}
        <div style={{ position: 'relative', flex: '0 0 auto', display: 'flex', justifyContent: 'center', maxHeight: '50vh' }}>
          <div style={{ width: '100%', maxWidth: 'calc(50vh * 16 / 9)', position: 'relative' }}>
            <CameraView videoRef={videoRef} canvasRef={canvasRef} fps={detectionFps} />
            {status === 'preparing' && (
              <div className="animate-fade-in" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', borderRadius: 'var(--radius-lg)', zIndex: 20, backdropFilter: 'blur(4px)' }}>
                {countdown > 0 ? (
                  <span style={{ fontSize: '8rem', fontWeight: 800, color: 'var(--color-accent-amber)', textShadow: '0 0 40px rgba(255,171,0,0.5)' }}>{countdown}</span>
                ) : (
                  <>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👀</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem', textAlign: 'center' }}>
                      {readinessMessage || 'Getting into position...'}
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', textAlign: 'center', maxWidth: '80%' }}>
                      Ensure your full body is visible and hold still. The countdown will begin automatically.
                    </p>
                    
                    {activeTest !== 'exercise_form' && activeTest !== 'free_analysis' && (
                      <div style={{ width: '60%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-accent-amber)' }}>
                          <span>Stability Requirement</span>
                          <span>{Math.round(stability * 100)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${stability * 100}%`, height: '100%', background: 'var(--color-accent-amber)', borderRadius: '4px', transition: 'width 0.2s var(--ease-smooth)' }} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {status === 'recording' && (
              <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 20, padding: '0.375rem 0.75rem', background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.4)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent-emerald)' }}>
                <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent-emerald)', display: 'inline-block' }} />
                {recordingElapsed}s / {RECORDING_SECONDS}s
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Results */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Exercise Form Check Result */}
          {activeTest === 'exercise_form' && (formCheckLoading || formCheckResult) && (
            <div className="glass-card-accent animate-fade-in" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-accent-cyan)', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🎯 Exercise Form Analysis
                {formCheckLoading && <span className="animate-spin" style={{ display: 'inline-block', fontSize: '0.75rem' }}>⏳</span>}
              </h3>
              {formCheckLoading ? (
                <div className="skeleton" style={{ height: '80px' }} />
              ) : (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {formCheckResult}
                </p>
              )}
            </div>
          )}

          {/* LLM Summary (for non-exercise-form tests) */}
          {activeTest !== 'exercise_form' && (llmLoading || llmSummary) && (
            <div className="glass-card-accent animate-fade-in" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-accent-cyan)', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🤖 AI Coach Summary
                {llmLoading && <span className="animate-spin" style={{ display: 'inline-block', fontSize: '0.75rem' }}>⏳</span>}
              </h3>
              {llmLoading ? (
                <div className="skeleton" style={{ height: '60px' }} />
              ) : (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {llmSummary}
                </p>
              )}
            </div>
          )}

          <RecommendationPanel recommendations={status === 'complete' ? recommendations : []} />
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
        <MetricsPanel metrics={postureMetrics} />
        <FindingsList findings={status === 'complete' || status === 'recording' ? findings : []} />
      </div>
    </div>
  );
};
