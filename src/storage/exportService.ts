/**
 * Export service — export session data as JSON or CSV.
 */

import type { Session } from '../types';

/**
 * Export a session as a JSON file download.
 */
export function exportSessionAsJSON(session: Session): void {
  const json = JSON.stringify(session, null, 2);
  downloadFile(json, `symmetry-session-${formatDate(session.date)}.json`, 'application/json');
}

/**
 * Export a session as a CSV file download.
 */
export function exportSessionAsCSV(session: Session): void {
  const lines: string[] = [];

  // Header
  lines.push('Metric,Value');
  lines.push('');

  // Session info
  lines.push(`Date,${new Date(session.date).toISOString()}`);
  lines.push(`Test Type,${session.testLabel}`);
  lines.push(`Overall Score,${session.overallScore}`);
  lines.push(`Symmetry Score,${session.symmetryScore}`);
  lines.push(`Duration (s),${session.duration}`);
  lines.push('');

  // Measurements
  lines.push('--- Measurements ---,');
  const metrics = session.measurements;
  lines.push(`Forward Head Angle,${metrics.forwardHeadAngle.toFixed(1)}°`);
  lines.push(`Shoulder Height Diff,${metrics.shoulderHeightDiff.toFixed(1)}°`);
  lines.push(`Shoulder Rotation,${metrics.shoulderRotation.toFixed(1)}`);
  lines.push(`Pelvic Tilt,${metrics.pelvicTilt.toFixed(1)}°`);
  lines.push(`Pelvic Rotation,${metrics.pelvicRotation.toFixed(1)}`);
  lines.push(`Hip Shift,${metrics.hipShift.toFixed(1)}`);
  lines.push(`Left Knee Angle,${metrics.leftKneeAngle.toFixed(1)}°`);
  lines.push(`Right Knee Angle,${metrics.rightKneeAngle.toFixed(1)}°`);
  lines.push(`Trunk Lean,${metrics.trunkLean.toFixed(1)}°`);
  lines.push(`Spinal Alignment,${metrics.spinalAlignment.toFixed(1)}`);
  lines.push(`Weight Shift,${metrics.weightShift.toFixed(1)}`);
  lines.push(`Symmetry Score,${metrics.symmetryScore.toFixed(1)}`);
  lines.push('');

  // Findings
  lines.push('--- Findings ---,');
  lines.push('Finding,Severity,Measured Value,Message');
  for (const finding of session.assessment.findings) {
    lines.push(
      `"${finding.name}",${finding.severity},${finding.measuredValue.toFixed(1)},"${finding.message}"`
    );
  }

  const csv = lines.join('\n');
  downloadFile(csv, `symmetry-session-${formatDate(session.date)}.csv`, 'text/csv');
}

/**
 * Trigger a file download in the browser.
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format a timestamp for filenames.
 */
function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
