/**
 * ConfidenceBadge — visual indicator of detection confidence.
 */

import React from 'react';
import type { Confidence } from '../../types';

interface ConfidenceBadgeProps {
  confidence: Confidence;
  value?: number;
}

const CONFIDENCE_CONFIG: Record<Confidence, { label: string; color: string; cssClass: string }> = {
  high: { label: 'High', color: 'var(--color-severity-normal)', cssClass: 'confidence-high' },
  medium: { label: 'Medium', color: 'var(--color-severity-mild)', cssClass: 'confidence-medium' },
  low: { label: 'Low', color: 'var(--color-severity-moderate)', cssClass: 'confidence-low' },
};

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, value }) => {
  const config = CONFIDENCE_CONFIG[confidence];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.25rem 0.625rem',
        fontSize: '0.6875rem',
        fontWeight: 500,
        color: config.color,
        background: `${config.color}15`,
        borderRadius: 'var(--radius-full)',
        border: `1px solid ${config.color}30`,
      }}
    >
      <span className={`confidence-dot ${config.cssClass}`} />
      {config.label}
      {value !== undefined && (
        <span style={{ opacity: 0.7 }}>
          ({Math.round(value * 100)}%)
        </span>
      )}
    </div>
  );
};
