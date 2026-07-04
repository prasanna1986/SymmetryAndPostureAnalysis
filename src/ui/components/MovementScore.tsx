/**
 * Circular score gauge component.
 */

import React from 'react';

interface MovementScoreProps {
  score: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-severity-normal)';
  if (score >= 60) return 'var(--color-severity-mild)';
  if (score >= 40) return 'var(--color-severity-moderate)';
  return 'var(--color-severity-significant)';
}

export const MovementScore: React.FC<MovementScoreProps> = ({
  score,
  label,
  size = 100,
  strokeWidth = 6,
  color,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const actualColor = color || getScoreColor(score);

  return (
    <div
      className="score-ring"
      style={{ width: size, height: size, position: 'relative' }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={actualColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.6s var(--ease-smooth), stroke 0.3s',
            filter: `drop-shadow(0 0 6px ${actualColor}40)`,
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: size * 0.28,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1,
          }}
        >
          {Math.round(score)}
        </span>
        <span
          style={{
            fontSize: size * 0.1,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
            marginTop: '2px',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};
