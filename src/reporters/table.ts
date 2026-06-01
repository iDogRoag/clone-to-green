import pc from 'picocolors';
import type { CloneToGreenReport } from '../types.js';
import { commandToString } from '../utils/path.js';

export function renderTableReport(report: CloneToGreenReport, options: { color?: boolean } = {}): string {
  const color = options.color ?? true;
  const paint = color ? pc : noColor;
  const lines = [
    `${paint.bold('Clone To Green')} ${statusLabel(report.result.status, color)}`,
    report.result.summary,
    '',
    `Source: ${report.source.input}`,
    `Status: ${report.result.status.toUpperCase()}`,
    `Reproducibility score: ${report.reproducibility.score} out of 100`,
    `Confidence: ${report.reproducibility.confidence}`,
    `Detected project: ${report.detection.profile}`,
    `Package manager: ${report.detection.packageManager ?? '-'}`,
    `Commands run: ${report.steps.filter((step) => step.status === 'passed' || step.status === 'failed' || step.status === 'timeout').length}`,
    `Duration: ${report.result.durationMs}ms`,
    `Workspace: ${report.workspace.workdir}${report.workspace.kept ? ' (kept)' : ''}`,
    '',
    'Steps:'
  ];

  const rows = report.steps.length > 0 ? report.steps : report.plan.steps.map((step) => ({
    name: step.name,
    command: step.command,
    status: step.skipped ? 'skipped' : 'planned',
    durationMs: 0
  }));

  for (const step of rows) {
    lines.push(`  ${step.name.padEnd(7)} ${String(step.status).padEnd(8)} ${commandToString(step.command) || '-'}`);
  }

  return `${lines.join('\n')}\n`;
}

function statusLabel(status: CloneToGreenReport['result']['status'], color: boolean): string {
  const label = status.toUpperCase();
  if (!color) {
    return label;
  }
  if (status === 'green') {
    return pc.green(label);
  }
  if (status === 'red') {
    return pc.red(label);
  }
  return pc.yellow(label);
}

const noColor = {
  bold: (value: string) => value
};
