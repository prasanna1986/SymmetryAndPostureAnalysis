/**
 * HistoryView — browse past sessions with scores and details.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { loadAllSessions, loadSession, deleteSession as deleteFromDB } from '../../storage/sessionStorage';
import { exportSessionAsJSON, exportSessionAsCSV } from '../../storage/exportService';
import { MovementScore } from '../components/MovementScore';
import { FindingsList } from '../components/AssessmentCard';
import type { Session, SessionSummary } from '../../types';

export const HistoryView: React.FC = () => {
  const { sessions, setSessions, selectedSession, setSelectedSession, removeSession } = useSessionStore();
  const [loading, setLoading] = useState(true);

  // Load sessions on mount
  useEffect(() => {
    loadAllSessions()
      .then((s) => {
        setSessions(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setSessions]);

  const handleSelectSession = useCallback(async (summary: SessionSummary) => {
    try {
      const full = await loadSession(summary.id);
      if (full) setSelectedSession(full);
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  }, [setSelectedSession]);

  const handleDeleteSession = useCallback(async (id: string) => {
    try {
      await deleteFromDB(id);
      removeSession(id);
      if (selectedSession?.id === id) setSelectedSession(null);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  }, [removeSession, selectedSession, setSelectedSession]);

  const handleExportJSON = useCallback(() => {
    if (selectedSession) exportSessionAsJSON(selectedSession);
  }, [selectedSession]);

  const handleExportCSV = useCallback(() => {
    if (selectedSession) exportSessionAsCSV(selectedSession);
  }, [selectedSession]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1rem', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      {/* Sessions list */}
      <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', padding: '0.5rem 0' }}>
          Session History
        </h2>

        {loading && (
          <div className="glass-card-static" style={{ padding: '2rem', textAlign: 'center' }}>
            <span className="animate-spin" style={{ display: 'inline-block' }}>⏳</span>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Loading sessions...</p>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="glass-card-static empty-state" style={{ padding: '3rem 1rem' }}>
            <div className="empty-state-icon">📊</div>
            <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>No sessions yet</p>
            <p style={{ fontSize: '0.75rem' }}>Complete an assessment and save it to see history here.</p>
          </div>
        )}

        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => handleSelectSession(session)}
            className={selectedSession?.id === session.id ? 'glass-card-accent' : 'glass-card'}
            style={{
              padding: '0.75rem',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              border: selectedSession?.id === session.id ? undefined : '1px solid var(--color-border-primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {session.testLabel}
              </span>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-accent-cyan)' }}>
                {session.overallScore}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              <span>{formatDate(session.date)}</span>
              <span>{session.findingsCount} findings</span>
            </div>
          </button>
        ))}
      </div>

      {/* Session detail */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!selectedSession ? (
          <div className="glass-card-static empty-state" style={{ height: '100%' }}>
            <div className="empty-state-icon">👈</div>
            <p style={{ fontSize: '0.875rem' }}>Select a session to view details</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Session header */}
            <div className="glass-card-static" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {selectedSession.testLabel}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  {formatDate(selectedSession.date)}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <MovementScore score={selectedSession.overallScore} label="Score" size={72} />
                <MovementScore score={selectedSession.symmetryScore} label="Symmetry" size={64} color="var(--color-accent-violet)" />
              </div>
            </div>

            {/* Export / Delete buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={handleExportJSON}>📄 Export JSON</button>
              <button className="btn-secondary" onClick={handleExportCSV}>📊 Export CSV</button>
              <button
                className="btn-secondary"
                onClick={() => handleDeleteSession(selectedSession.id)}
                style={{ marginLeft: 'auto', color: 'var(--color-severity-significant)' }}
              >
                🗑 Delete
              </button>
            </div>

            {/* Findings */}
            <FindingsList findings={selectedSession.assessment.findings} />
          </div>
        )}
      </div>
    </div>
  );
};
