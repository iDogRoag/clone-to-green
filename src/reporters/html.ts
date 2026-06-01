import type { CloneToGreenReport } from '../types.js';
import { commandToString } from '../utils/path.js';

export function renderHtmlReport(report: CloneToGreenReport): string {
  const rows = report.steps.length > 0 ? report.steps : report.plan.steps.map((step) => ({
    name: step.name,
    command: step.command,
    status: step.skipped ? 'skipped' : 'planned',
    durationMs: 0
  }));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Clone To Green Report</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 2rem; color: #17202a; }
    main { max-width: 920px; }
    .cards { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin: 1rem 0; }
    .card { border: 1px solid #d8dee4; border-radius: 8px; padding: 0.75rem; }
    .label { color: #57606a; font-size: 0.85rem; margin: 0 0 0.25rem; }
    .value { font-size: 1.35rem; font-weight: 700; margin: 0; }
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    th, td { border: 1px solid #d8dee4; padding: 0.55rem; text-align: left; }
    th { background: #f6f8fa; }
    code { background: #f6f8fa; padding: 0.1rem 0.25rem; border-radius: 4px; }
  </style>
</head>
<body>
  <main>
    <h1>Clone To Green Report</h1>
    <p><strong>Status:</strong> ${escapeHtml(report.result.status.toUpperCase())}</p>
    <p><strong>Summary:</strong> ${escapeHtml(report.result.summary)}</p>
    <p><strong>Source:</strong> <code>${escapeHtml(report.source.input)}</code></p>
    <p><strong>Workspace:</strong> <code>${escapeHtml(report.workspace.workdir)}</code></p>
    <p><strong>Profile:</strong> <code>${escapeHtml(report.detection.profile)}</code></p>
    <section class="cards" aria-label="Reproducibility summary">
      <div class="card"><p class="label">Status</p><p class="value">${escapeHtml(report.result.status.toUpperCase())}</p></div>
      <div class="card"><p class="label">Reproducibility score</p><p class="value">${report.reproducibility.score}/100</p></div>
      <div class="card"><p class="label">Confidence</p><p class="value">${escapeHtml(report.reproducibility.confidence)}</p></div>
    </section>
    <h2>Reproducibility Penalties</h2>
    <table>
      <thead><tr><th>Penalty</th><th>Points</th><th>Message</th></tr></thead>
      <tbody>
        ${
          report.reproducibility.penalties.length > 0
            ? report.reproducibility.penalties
                .map(
                  (penalty) =>
                    `<tr><td>${escapeHtml(penalty.label)}</td><td>${penalty.points}</td><td>${escapeHtml(penalty.message)}</td></tr>`
                )
                .join('\n        ')
            : '<tr><td>None</td><td>0</td><td>No reproducibility penalties were detected.</td></tr>'
        }
      </tbody>
    </table>
    <h2>Steps</h2>
    <table>
      <thead><tr><th>Step</th><th>Status</th><th>Command</th><th>Duration</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (step) =>
              `<tr><td>${escapeHtml(step.name)}</td><td>${escapeHtml(step.status)}</td><td><code>${escapeHtml(commandToString(step.command))}</code></td><td>${step.durationMs}ms</td></tr>`
          )
          .join('\n        ')}
      </tbody>
    </table>
  </main>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
