/**
 * Recommendation panel — displays exercises and tips.
 */

import React, { useState } from 'react';
import type { Recommendation } from '../../types';

interface RecommendationPanelProps {
  recommendations: Recommendation[];
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ recommendations }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (recommendations.length === 0) {
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
          Recommendations
        </h3>
        <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
          <p style={{ fontSize: '0.8125rem' }}>No specific recommendations at this time</p>
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
        Recommendations
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '500px', overflowY: 'auto' }}>
        {recommendations.map((rec) => {
          const isExpanded = expandedId === rec.knowledgeEntryId;

          return (
            <div
              key={rec.knowledgeEntryId}
              style={{
                background: 'var(--color-bg-glass)',
                border: '1px solid var(--color-border-primary)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                transition: 'all 0.2s var(--ease-smooth)',
              }}
            >
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : rec.knowledgeEntryId)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {rec.conditionName}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {rec.exercises.length} exercises • {rec.awarenessTips.length} tips
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                  }}
                >
                  ▼
                </span>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  className="animate-fade-in"
                  style={{
                    padding: '0 0.75rem 0.75rem',
                    borderTop: '1px solid var(--color-border-primary)',
                  }}
                >
                  {/* Exercises */}
                  <div style={{ marginTop: '0.75rem' }}>
                    <h4
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--color-accent-cyan)',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Exercises
                    </h4>
                    {rec.exercises.map((ex) => (
                      <div
                        key={ex.id}
                        style={{
                          padding: '0.5rem',
                          marginBottom: '0.375rem',
                          background: 'rgba(0, 212, 255, 0.04)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {ex.name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.625rem',
                              color: 'var(--color-text-muted)',
                              background: 'var(--color-bg-glass)',
                              padding: '0.125rem 0.375rem',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {ex.category}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                          {ex.description}
                        </p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--color-accent-emerald)', marginTop: '0.25rem' }}>
                          📋 {ex.dosage}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Tips */}
                  {rec.awarenessTips.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <h4
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--color-accent-amber)',
                          marginBottom: '0.375rem',
                        }}
                      >
                        Awareness Tips
                      </h4>
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {rec.awarenessTips.map((tip, i) => (
                          <li
                            key={i}
                            style={{
                              fontSize: '0.6875rem',
                              color: 'var(--color-text-secondary)',
                              padding: '0.25rem 0',
                              paddingLeft: '1rem',
                              position: 'relative',
                            }}
                          >
                            <span style={{ position: 'absolute', left: 0 }}>•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <p
                    style={{
                      fontSize: '0.625rem',
                      color: 'var(--color-text-muted)',
                      marginTop: '0.75rem',
                      fontStyle: 'italic',
                      lineHeight: 1.4,
                    }}
                  >
                    These are general movement suggestions, not medical advice. Consult a healthcare professional if you experience pain.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
