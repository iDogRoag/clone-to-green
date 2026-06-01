import { describe, expect, test } from 'vitest';
import { renderHtmlReport } from '../src/reporters/html.js';
import { renderJsonReport } from '../src/reporters/json.js';
import { renderMarkdownReport } from '../src/reporters/markdown.js';
import { renderTableReport } from '../src/reporters/table.js';
import type { CloneToGreenReport } from '../src/types.js';

const report: CloneToGreenReport = {
  tool: 'clone-to-green',
  version: '0.1.0',
  source: { input: '.', kind: 'local', resolved: '/repo' },
  workspace: { path: '/tmp/ctg', kept: false, workdir: '/tmp/ctg' },
  detection: { profile: 'node', packageManager: 'npm', reasons: ['package.json found'] },
  plan: { steps: [{ name: 'test', command: ['npm', 'test'], skipped: false, required: true }] },
  reproducibility: {
    score: 86,
    confidence: 'good',
    signals: [{ id: 'real_tests', label: 'Real test command ran', points: 0, message: 'npm test passed.' }],
    penalties: []
  },
  result: {
    status: 'green',
    summary: 'All configured steps passed.',
    startedAt: '2026-01-01T00:00:00.000Z',
    endedAt: '2026-01-01T00:00:01.000Z',
    durationMs: 1000
  },
  steps: [{ name: 'test', command: ['npm', 'test'], status: 'passed', exitCode: 0, durationMs: 1000 }]
};

describe('reporters', () => {
  test('renders json', () => {
    expect(JSON.parse(renderJsonReport(report))).toMatchObject({ tool: 'clone-to-green' });
  });

  test('renders markdown', () => {
    expect(renderMarkdownReport(report)).toContain('## Reproducibility');
    expect(renderMarkdownReport(report)).toContain('| test | passed | `npm test` |');
  });

  test('renders html with escaped content', () => {
    expect(renderHtmlReport({ ...report, result: { ...report.result, summary: '<green>' } })).toContain('&lt;green&gt;');
  });

  test('renders table', () => {
    expect(renderTableReport(report, { color: false })).toContain('GREEN');
  });
});
