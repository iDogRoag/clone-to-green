import type { FailureCategory, StepName } from './types.js';

export function classifyFailure(input: {
  step?: StepName;
  exitCode?: number;
  timedOut?: boolean;
  failedToStart?: boolean;
}): FailureCategory {
  if (input.timedOut) {
    return 'timeout';
  }
  if (input.failedToStart) {
    return 'missing_tool';
  }
  if (input.step === 'install') {
    return 'install_failed';
  }
  if (input.step === 'build') {
    return 'build_failed';
  }
  if (input.step === 'test') {
    return 'test_failed';
  }
  return 'internal_error';
}
