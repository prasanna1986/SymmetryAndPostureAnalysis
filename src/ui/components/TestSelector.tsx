/**
 * Test selector component — choose movement assessment type.
 */

import React from 'react';
import type { MovementTestType } from '../../types';
import { testLabels } from '../../assessment/assessmentRunner';

interface TestSelectorProps {
  activeTest: MovementTestType;
  onSelect: (test: MovementTestType) => void;
}

const TEST_ICONS: Record<MovementTestType, string> = {
  standing_posture: '🧍',
  overhead_reach: '🙌',
  squat: '🏋️',
  single_leg_balance: '🦩',
  forward_bend: '🙇',
  free_analysis: '🔍',
  exercise_form: '🎯',
};

const TEST_DESCRIPTIONS: Record<MovementTestType, string> = {
  standing_posture: 'Assess static alignment',
  overhead_reach: 'Shoulder mobility test',
  squat: 'Lower body mechanics',
  single_leg_balance: 'Hip stability & balance',
  forward_bend: 'Posterior chain flexibility',
  free_analysis: 'General movement evaluation',
  exercise_form: 'Check any exercise form',
};

export const TestSelector: React.FC<TestSelectorProps> = ({ activeTest, onSelect }) => {
  const tests = Object.keys(testLabels) as MovementTestType[];

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
        Movement Test
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {tests.map((test) => (
          <button
            key={test}
            onClick={() => onSelect(test)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.625rem 0.75rem',
              background:
                activeTest === test
                  ? 'var(--color-accent-cyan-dim)'
                  : 'transparent',
              border:
                activeTest === test
                  ? '1px solid rgba(0, 212, 255, 0.3)'
                  : '1px solid transparent',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s var(--ease-smooth)',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              if (activeTest !== test) {
                e.currentTarget.style.background = 'var(--color-bg-glass)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTest !== test) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>{TEST_ICONS[test]}</span>
            <div>
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: activeTest === test ? 600 : 500,
                  color:
                    activeTest === test
                      ? 'var(--color-accent-cyan)'
                      : 'var(--color-text-primary)',
                }}
              >
                {testLabels[test]}
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '1px',
                }}
              >
                {TEST_DESCRIPTIONS[test]}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
