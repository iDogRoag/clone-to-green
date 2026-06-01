import { describe, expect, test } from 'vitest';
import { classifyFailure } from '../src/failure-analysis.js';

describe('classifyFailure', () => {
  test('classifies step failures by step name', () => {
    expect(classifyFailure({ step: 'install', exitCode: 1, timedOut: false })).toBe('install_failed');
    expect(classifyFailure({ step: 'build', exitCode: 1, timedOut: false })).toBe('build_failed');
    expect(classifyFailure({ step: 'test', exitCode: 1, timedOut: false })).toBe('test_failed');
  });

  test('classifies timeouts and missing tools', () => {
    expect(classifyFailure({ step: 'test', timedOut: true })).toBe('timeout');
    expect(classifyFailure({ step: 'test', exitCode: undefined, timedOut: false, failedToStart: true })).toBe('missing_tool');
  });
});
