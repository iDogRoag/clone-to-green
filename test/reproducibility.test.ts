import { describe, expect, test } from 'vitest';
import { fileURLToPath } from 'node:url';
import { assessReproducibility } from '../src/reproducibility.js';
import type { ExecutionPlan, ExecutionResult } from '../src/types.js';

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url));

describe('assessReproducibility', () => {
  test('scores a deterministic Node repo with real tests as strong', async () => {
    const plan: ExecutionPlan = {
      detection: {
        profile: 'node',
        packageManager: 'npm',
        reasons: [],
        commands: { install: ['npm', 'ci'], build: ['npm', 'run', 'build'], test: ['npm', 'test'] }
      },
      workdir: `${fixture}node-pass`,
      steps: [
        { name: 'install', command: ['npm', 'ci'], skipped: false, required: true },
        { name: 'build', command: ['npm', 'run', 'build'], skipped: false, required: false },
        { name: 'test', command: ['npm', 'test'], skipped: false, required: true }
      ]
    };
    const result = executionResult('green');

    const score = await assessReproducibility(plan, result, {
      configFilePresent: false,
      envFileProvided: false,
      workdirProvided: false
    });

    expect(score.score).toBeGreaterThanOrEqual(90);
    expect(score.confidence).toBe('strong');
    expect(score.signals.map((signal) => signal.id)).toContain('real_test_command_ran');
  });

  test('penalizes missing tests and missing Node lockfiles', async () => {
    const plan: ExecutionPlan = {
      detection: {
        profile: 'node',
        packageManager: 'npm',
        reasons: [],
        commands: { install: ['npm', 'install'] }
      },
      workdir: `${fixture}node-no-tests`,
      steps: [
        { name: 'install', command: ['npm', 'install'], skipped: false, required: true },
        { name: 'build', command: [], skipped: true, reason: 'no_command', required: false },
        { name: 'test', command: [], skipped: true, reason: 'no_test_detected', required: true }
      ]
    };

    const score = await assessReproducibility(plan, executionResult('red'), {
      configFilePresent: false,
      envFileProvided: false,
      workdirProvided: false
    });

    expect(score.score).toBeLessThan(90);
    expect(score.confidence).not.toBe('strong');
    expect(score.penalties.map((penalty) => penalty.id)).toEqual(
      expect.arrayContaining(['no_real_test_command', 'missing_node_lockfile', 'non_deterministic_install'])
    );
  });
});

function executionResult(status: ExecutionResult['status']): ExecutionResult {
  return {
    status,
    summary: status,
    startedAt: '2026-01-01T00:00:00.000Z',
    endedAt: '2026-01-01T00:00:01.000Z',
    durationMs: 1000,
    steps: [{ name: 'test', command: ['npm', 'test'], status: status === 'red' ? 'skipped' : 'passed', durationMs: 10 }]
  };
}
