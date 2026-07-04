/**
 * Assessment finding card component.
 */

import React from 'react';
import type { AssessmentFinding } from '../../types';

interface AssessmentCardProps {
  finding: AssessmentFinding;
  index: number;
}

const SEVERITY_STYLES: Record<string, { badge: string; border: string }> = {
  normal: { badge: 'badge-normal', border: 'rgba(0, 230, 118, 0.15)' },
  mild: { badge: 'badge-mild', border: 'rgba(255, 235, 59, 0.15)' },
  moderate: { badge: 'badge-moderate', border: 'rgba(255, 152, 0, 0.15)' },
  significant: { badge: 'badge-significant', border: 'rgba(244, 67, 54, 0.15)' },
};

export const AssessmentCard: React.FC<AssessmentCardProps> = ({ finding, index }) => {
  const styles = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.mild;

  return (
    <div
      className="animate-slide-up"
      style={{
        padding: '0.75rem',
        background: 'var(--color-bg-glass)',
        border: `1px solid ${styles.border}`,
        borderRadius: 'var(--radius-md)',
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.375rem',
        }}
      >
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {finding.name}
        </span>
        <span className={`badge ${styles.badge}`}>{finding.severity}</span>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
        {finding.message}
      </p>
      {finding.coaching && (
        <p
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-accent-cyan)',
            marginTop: '0.375rem',
            lineHeight: 1.4,
            fontStyle: 'italic',
          }}
        >
          💡 {finding.coaching}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginTop: '0.375rem',
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <span>Value: {finding.measuredValue.toFixed(1)}</span>
        <span>Confidence: {finding.confidence}</span>
      </div>
    </div>
  );
};

/**
 * Findings list component.
 */
interface FindingsListProps {
  findings: AssessmentFinding[];
}

export const FindingsList: React.FC<FindingsListProps> = ({ findings }) => {
  if (findings.length === 0) {
    return (
      <div className="glass-card-static" style={{ padding: '1rem' }}>
        <h3
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
            marginBottom: '0.75rem',
          }}
        >
          Findings
        </h3>
        <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-severity-normal)' }}>
            ✓ No significant findings
          </p>
          <p style={{ fontSize: '0.6875rem', marginTop: '0.25rem' }}>
            Posture appears within normal ranges
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <h3
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
          }}
        >
          Findings
        </h3>
        <span
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            background: 'var(--color-bg-glass)',
            padding: '0.125rem 0.5rem',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {findings.length}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
        {findings.map((finding, i) => (
          <AssessmentCard key={finding.ruleId} finding={finding} index={i} />
        ))}
      </div>
    </div>
  );
};
