/**
 * Header component with app branding and navigation.
 */

import React from 'react';

type View = 'live' | 'history' | 'settings';

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid var(--color-border-primary)',
        background: 'rgba(10, 14, 26, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Logo / Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '2rem',
            height: '2rem',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-emerald))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            fontWeight: 800,
            color: 'var(--color-bg-primary)',
          }}
        >
          S
        </div>
        <div>
          <h1
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-emerald))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Symmetry
          </h1>
          <p
            style={{
              fontSize: '0.625rem',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: '1px',
            }}
          >
            Posture & Movement
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', gap: '0.25rem' }}>
        <button
          className={`nav-tab ${currentView === 'live' ? 'nav-tab-active' : ''}`}
          onClick={() => onViewChange('live')}
        >
          <span>◉</span> Live
        </button>
        <button
          className={`nav-tab ${currentView === 'history' ? 'nav-tab-active' : ''}`}
          onClick={() => onViewChange('history')}
        >
          <span>📊</span> History
        </button>
        <button
          className={`nav-tab ${currentView === 'settings' ? 'nav-tab-active' : ''}`}
          onClick={() => onViewChange('settings')}
        >
          <span>⚙</span> Settings
        </button>
      </nav>

      {/* Privacy badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.375rem 0.75rem',
          fontSize: '0.6875rem',
          color: 'var(--color-accent-emerald)',
          background: 'var(--color-accent-emerald-dim)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(0, 230, 118, 0.2)',
        }}
      >
        <span>🔒</span> 100% Local
      </div>
    </header>
  );
};
