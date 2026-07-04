/**
 * Metrics panel — displays real-time biomechanical measurements.
 */

import React from 'react';
import type { PostureMetrics } from '../../types';

interface MetricsPanelProps {
  metrics: PostureMetrics | null;
}

interface MetricRowProps {
  label: string;
  value: number;
  unit: string;
  normalRange: [number, number];
  showSign?: boolean;
}

function getSeverityForValue(value: number, normalRange: [number, number]): string {
  const absVal = Math.abs(value);
  const threshold = Math.max(Math.abs(normalRange[0]), Math.abs(normalRange[1]));
  if (absVal <= threshold) return 'normal';
  if (absVal <= threshold * 2) return 'mild';
  if (absVal <= threshold * 3.5) return 'moderate';
  return 'significant';
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'normal': return 'var(--color-severity-normal)';
    case 'mild': return 'var(--color-severity-mild)';
    case 'moderate': return 'var(--color-severity-moderate)';
    case 'significant': return 'var(--color-severity-significant)';
    default: return 'var(--color-text-secondary)';
  }
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value, unit, normalRange, showSign }) => {
  const severity = getSeverityForValue(value, normalRange);
  const color = getSeverityColor(severity);
  const displayVal = showSign && value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);

  // Bar fill percentage
  const maxRange = Math.max(Math.abs(normalRange[0]), Math.abs(normalRange[1])) * 4;
  const fillPercent = Math.min(100, (Math.abs(value) / maxRange) * 100);

  return (
    <div style={{ marginBottom: '0.625rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.25rem',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color, fontFamily: "'SF Mono', monospace" }}>
          {displayVal}{unit}
        </span>
      </div>
      <div className="metric-bar">
        <div
          className="metric-bar-fill"
          style={{
            width: `${fillPercent}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
};

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  if (!metrics) {
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
          Measurements
        </h3>
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
          <p style={{ fontSize: '0.8125rem' }}>Start camera to see measurements</p>
        </div>
      </div>
    );
  }

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
        Measurements
      </h3>

      <MetricRow label="Forward Head" value={metrics.forwardHeadAngle} unit="°" normalRange={[0, 8]} />
      <MetricRow label="Shoulder Tilt" value={metrics.shoulderHeightDiff} unit="°" normalRange={[-3, 3]} showSign />
      <MetricRow label="Shoulder Rotation" value={metrics.shoulderRotation} unit="" normalRange={[-5, 5]} showSign />
      <MetricRow label="Pelvic Tilt" value={metrics.pelvicTilt} unit="°" normalRange={[-3, 3]} showSign />
      <MetricRow label="Hip Shift" value={metrics.hipShift} unit="" normalRange={[-5, 5]} showSign />
      <MetricRow label="L Knee Angle" value={metrics.leftKneeAngle} unit="°" normalRange={[-5, 5]} />
      <MetricRow label="R Knee Angle" value={metrics.rightKneeAngle} unit="°" normalRange={[-5, 5]} />
      <MetricRow label="Trunk Lean" value={metrics.trunkLean} unit="°" normalRange={[-4, 4]} showSign />
      <MetricRow label="Weight Shift" value={metrics.weightShift} unit="" normalRange={[-5, 5]} showSign />
    </div>
  );
};
