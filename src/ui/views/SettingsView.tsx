/**
 * SettingsView — camera and assessment configuration.
 */

import React from 'react';
import { useCameraStore } from '../../stores/cameraStore';

export const SettingsView: React.FC = () => {
  const { isMirrored, setMirrored } = useCameraStore();

  return (
    <div style={{ padding: '1.5rem', maxWidth: '640px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Settings</h2>

      {/* Camera Settings */}
      <div className="glass-card-static" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-text-muted)',
            marginBottom: '1rem',
          }}
        >
          Camera
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Mirror Video</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Flip the camera feed horizontally</p>
          </div>
          <div
            className={`toggle ${isMirrored ? 'active' : ''}`}
            onClick={() => setMirrored(!isMirrored)}
            role="switch"
            aria-checked={isMirrored}
            tabIndex={0}
          />
        </div>
      </div>

      {/* About */}
      <div className="glass-card-static" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-text-muted)',
            marginBottom: '1rem',
          }}
        >
          About
        </h3>

        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          <p><strong>Symmetry</strong> is an AI-powered posture and movement assessment tool that runs entirely in your browser.</p>
          <p style={{ marginTop: '0.5rem' }}>
            Using MediaPipe Pose Landmarker, it detects 33 body landmarks in real time and computes biomechanical
            measurements to identify common postural patterns.
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            All processing happens locally on your device. No video or data is ever uploaded to the cloud.
          </p>
        </div>
      </div>

      {/* Privacy */}
      <div className="glass-card-static" style={{ padding: '1.25rem' }}>
        <h3
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-accent-emerald)',
            marginBottom: '1rem',
          }}
        >
          🔒 Privacy
        </h3>

        <ul style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.8, listStyle: 'none', padding: 0 }}>
          <li>✓ No cloud services</li>
          <li>✓ No analytics or telemetry</li>
          <li>✓ No video uploads</li>
          <li>✓ No user accounts required</li>
          <li>✓ All data stored locally in your browser</li>
          <li>✓ Works completely offline after initial load</li>
        </ul>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
          background: 'rgba(244, 67, 54, 0.05)',
          border: '1px solid rgba(244, 67, 54, 0.1)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <strong>Disclaimer:</strong> This application does not provide medical diagnoses. It reports observable movement
        characteristics and suggests general movement improvements. If you experience pain or have concerns about your
        posture, please consult a qualified healthcare professional.
      </div>
    </div>
  );
};
