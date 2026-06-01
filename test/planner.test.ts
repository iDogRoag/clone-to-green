import { describe, expect, test } from 'vitest';
import { fileURLToPath } from 'node:url';
import { createPlan } from '../src/planner.js';

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url));

describe('createPlan', () => {
  test('applies config command overrides and CLI skips', async () => {
    const plan = await createPlan(`${fixture}node-pass`, {
      profile: 'auto',
      skipBuild: true,
      config: {
        commands: {
          test: ['node', '--test']
        }
      }
    });

    expect(plan.steps.find((step) => step.name === 'build')?.skipped).toBe(true);
    expect(plan.steps.find((step) => step.name === 'test')?.command).toEqual(['node', '--test']);
  });

  test('marks missing tests as no_test_detected', async () => {
    const plan = await createPlan(`${fixture}node-no-tests`, { profile: 'auto' });

    expect(plan.steps.find((step) => step.name === 'test')).toMatchObject({
      skipped: true,
      reason: 'no_test_detected',
      required: true
    });
  });
});
