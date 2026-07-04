/**
 * CameraView component — video element with controls overlay.
 * Supports live camera and uploaded video file playback.
 * Includes zoom, mirror, fullscreen, and video source controls.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useCameraStore } from '../stores/cameraStore';
import { useCameraDevices } from './useCameraDevices';
import { useCameraStream } from './useCameraStream';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  fps?: number;
  children?: React.ReactNode;
}

export const CameraView: React.FC<CameraViewProps> = ({ videoRef, canvasRef, fps, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isMirrored, isFullscreen, selectedDeviceId, devices, error, zoom, videoSource, videoFileName } = useCameraStore();
  const { setMirrored, setFullscreen, setSelectedDevice, zoomIn, zoomOut, setZoom, setVideoSource, setVideoFileName, setStreaming } = useCameraStore();
  const { permission, requestPermission } = useCameraDevices();
  const { isStreaming, startCamera, stopCamera } = useCameraStream();

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch { /* unsupported */ }
  }, [setFullscreen]);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [setFullscreen]);

  const handleStartCamera = useCallback(async () => {
    if (videoRef.current) {
      setVideoSource('camera');
      setVideoFileName(null);
      setMirrored(true);
      await startCamera(videoRef.current);
    }
  }, [startCamera, videoRef, setVideoSource, setVideoFileName, setMirrored]);

  const handleToggleCamera = useCallback(async () => {
    if (isStreaming) {
      stopCamera();
      if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.src = ''; }
    } else {
      await handleStartCamera();
    }
  }, [isStreaming, stopCamera, handleStartCamera, videoRef]);

  // Handle video file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !videoRef.current) return;

    if (isStreaming) stopCamera();

    const url = URL.createObjectURL(file);
    const video = videoRef.current;
    video.srcObject = null;
    video.src = url;
    video.loop = true;
    video.muted = true;
    video.play();

    setVideoSource('file');
    setVideoFileName(file.name);
    setStreaming(true);
    setMirrored(false);
  }, [videoRef, isStreaming, stopCamera, setVideoSource, setVideoFileName, setStreaming, setMirrored]);

  const displayFps = fps ?? useCameraStore.getState().fps;

  // Build combined transform: mirror + zoom.
  // Both video and canvas must match so skeleton stays aligned.
  const transforms: string[] = [];
  if (isMirrored) transforms.push('scaleX(-1)');
  if (zoom > 1) transforms.push(`scale(${zoom})`);
  const combinedTransform = transforms.length > 0 ? transforms.join(' ') : undefined;

  return (
    <div
      ref={containerRef}
      className="video-container"
      // Don't use the CSS class for mirroring — we handle it inline to combine with zoom.
    >
      {/* Video element */}
      <video
        ref={videoRef}
        playsInline muted
        style={{
          display: isStreaming ? 'block' : 'none',
          transform: combinedTransform,
          transition: 'transform 0.3s var(--ease-smooth)',
        }}
      />

      {/* Canvas overlay for skeleton — same transform so they stay aligned */}
      <canvas
        ref={canvasRef}
        style={{
          display: isStreaming ? 'block' : 'none',
          transform: combinedTransform,
          transition: 'transform 0.3s var(--ease-smooth)',
        }}
      />

      {/* Top-left badges */}
      {isStreaming && (
        <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.375rem', zIndex: 10 }}>
          <div className="fps-badge">{displayFps} FPS</div>
          {zoom > 1 && <div className="fps-badge">{zoom.toFixed(2)}x</div>}
          {videoSource === 'file' && (
            <div className="fps-badge" style={{ color: 'var(--color-accent-violet)' }}>
              📁 {videoFileName || 'Video'}
            </div>
          )}
        </div>
      )}

      {/* Idle state */}
      {!isStreaming && (
        <div className="empty-state" style={{ position: 'absolute', inset: 0 }}>
          {error ? (
            <>
              <div className="empty-state-icon">⚠️</div>
              <p style={{ color: 'var(--color-severity-moderate)', marginBottom: '1rem', maxWidth: '320px', fontSize: '0.875rem' }}>{error}</p>
              <button className="btn-primary" onClick={handleStartCamera}>Try Again</button>
            </>
          ) : permission === 'denied' ? (
            <>
              <div className="empty-state-icon">🔒</div>
              <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Camera access denied</p>
              <p style={{ fontSize: '0.75rem', maxWidth: '280px', lineHeight: 1.5 }}>Please enable camera access in your browser settings and reload.</p>
            </>
          ) : (
            <>
              <div className="empty-state-icon">📷</div>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>Start your camera or load a video</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {permission === 'prompt' ? (
                  <button className="btn-primary" onClick={requestPermission}>Enable Camera</button>
                ) : (
                  <button className="btn-primary" onClick={handleStartCamera}>Start Camera</button>
                )}
                <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  📁 Load Video
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFileUpload} />

      {/* Bottom controls */}
      <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', right: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        {/* Left controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className={isStreaming ? 'btn-secondary' : 'btn-primary'}
            onClick={handleToggleCamera}
            style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
          >
            {isStreaming ? '⏹ Stop' : '▶ Start'}
          </button>

          {isStreaming && (
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}>
              📁
            </button>
          )}

          {devices.length > 1 && (
            <select className="select-styled" value={selectedDeviceId || ''} onChange={(e) => setSelectedDevice(e.target.value)} style={{ maxWidth: '160px' }}>
              {devices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
            </select>
          )}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button className="btn-icon" onClick={zoomOut} title="Zoom out" disabled={zoom <= 1} style={{ opacity: zoom <= 1 ? 0.4 : 1 }}>−</button>
          <button className="btn-icon" onClick={() => setZoom(1)} title="Reset zoom" style={{ fontSize: '0.625rem', width: 'auto', padding: '0 0.5rem' }}>
            {zoom > 1 ? `${zoom.toFixed(1)}x` : '1x'}
          </button>
          <button className="btn-icon" onClick={zoomIn} title="Zoom in" disabled={zoom >= 4} style={{ opacity: zoom >= 4 ? 0.4 : 1 }}>+</button>

          <div style={{ width: '1px', height: '1.5rem', background: 'var(--color-border-primary)', margin: '0 0.125rem' }} />

          <button className="btn-icon" onClick={() => setMirrored(!isMirrored)} title={isMirrored ? 'Unmirror' : 'Mirror'}>
            {isMirrored ? '🪞' : '↔'}
          </button>
          <button className="btn-icon" onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? '⊡' : '⛶'}
          </button>
        </div>
      </div>

      {children}
    </div>
  );
};
