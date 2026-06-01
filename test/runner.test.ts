import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { executePlan } from '../src/runner.js';
import type { ExecutionPlan } from '../src/types.js';

describe('executePlan', () => {
  test('passes a successful command and captures output', async () => {
    const artifactsDir = await mkdtemp(join(tmpdir(), 'ctg-runner-'));
    const plan: ExecutionPlan = {
      detection: { profile: 'custom', reasons: [], commands: { test: ['node', '-e', "console.log('ok')"] } },
      workdir: process.cwd(),
      steps: [{ name: 'test', command: ['node', '-e', "console.log('ok')"], skipped: false, required: true }]
    };

    const result = await executePlan(plan, {
      stepTimeoutSeconds: 10,
      artifactsDir,
      env: {},
      inheritEnv: false,
      verbose: false,
      allowNoTests: false
    });

    expect(result.status).toBe('green');
    expect(result.steps[0]?.status).toBe('passed');
    expect(result.steps[0]?.logPath).toBeTruthy();
    await rm(artifactsDir, { recursive: true, force: true });
  });

  test('returns red when no test is detected', async () => {
    const plan: ExecutionPlan = {
      detection: { profile: 'custom', reasons: [], commands: {} },
      workdir: process.cwd(),
      steps: [{ name: 'test', command: [], skipped: true, reason: 'no_test_detected', required: true }]
    };

    const result = await executePlan(plan, {
      stepTimeoutSeconds: 10,
      env: {},
      inheritEnv: false,
      verbose: false,
      allowNoTests: false
    });

    expect(result.status).toBe('red');
    expect(result.category).toBe('no_test_detected');
  });

  test('returns yellow when no test is detected and explicitly allowed', async () => {
    const plan: ExecutionPlan = {
      detection: { profile: 'custom', reasons: [], commands: {} },
      workdir: process.cwd(),
      steps: [{ name: 'test', command: [], skipped: true, reason: 'no_test_detected', required: true }]
    };

    const result = await executePlan(plan, {
      stepTimeoutSeconds: 10,
      env: {},
      inheritEnv: false,
      verbose: false,
      allowNoTests: true
    });

    expect(result.status).toBe('yellow');
    expect(result.category).toBe('no_test_detected');
  });
});
