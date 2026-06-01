import type { CloneToGreenReport } from '../types.js';
import { commandToString } from '../utils/path.js';

export function renderMarkdownReport(report: CloneToGreenReport): string {
  const rows = report.steps.length > 0 ? report.steps : report.plan.steps.map((step) => ({
    name: step.name,
    command: step.command,
    status: step.skipped ? 'skipped' : 'planned',
    durationMs: 0
  }));

  return [
    '# Clone To Green Report',
    '',
    `Status: **${report.result.status.toUpperCase()}**`,
    '',
    `Summary: ${report.result.summary}`,
    '',
    `Source: \`${report.source.input}\``,
    `Workspace: \`${report.workspace.workdir}\``,
    `Profile: \`${report.detection.profile}\``,
    '',
    '## Reproducibility',
    '',
    `Score: **${report.reproducibility.score} out of 100**`,
    `Confidence: **${report.reproducibility.confidence}**`,
    '',
    '| Penalty | Points | Message |',
    '| --- | ---: | --- |',
    ...(report.reproducibility.penalties.length > 0
      ? report.reproducibility.penalties.map((penalty) => `| ${penalty.label} | ${penalty.points} | ${penalty.message} |`)
      : ['| None | 0 | No reproducibility penalties were detected. |']),
    '',
    '## Steps',
    '',
    '| Step | Status | Command | Duration |',
    '| --- | --- | --- | --- |',
    ...rows.map((step) => `| ${step.name} | ${step.status} | \`${commandToString(step.command)}\` | ${step.durationMs}ms |`),
    ''
  ].join('\n');
}
