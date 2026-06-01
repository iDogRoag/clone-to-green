import { execa } from 'execa';
import { classifyFailure } from './failure-analysis.js';
import { writeStepLog } from './logs.js';
import type { ExecutePlanOptions, ExecutionPlan, ExecutionResult, StepResult } from './types.js';
import { commandToString } from './utils/path.js';
import { redactText } from './utils/redact.js';
import { elapsedMs, nowIso } from './utils/time.js';

export async function executePlan(plan: ExecutionPlan, options: ExecutePlanOptions): Promise<ExecutionResult> {
  const startedAt = nowIso();
  const overallStart = process.hrtime.bigint();
  const results: StepResult[] = [];
  let failureCategory: ExecutionResult['category'];
  let red = false;
  let yellow = false;
  let testPassed = false;

  for (const step of plan.steps) {
    if (step.skipped) {
      results.push({
        name: step.name,
        command: step.command,
        status: 'skipped',
        durationMs: 0
      });
      if (step.reason === 'no_test_detected') {
        failureCategory = 'no_test_detected';
        if (options.allowNoTests) {
          yellow = true;
        } else {
          red = true;
        }
      } else if (step.required) {
        failureCategory = step.name === 'install' ? 'install_failed' : step.name === 'build' ? 'build_failed' : 'test_failed';
        red = true;
      } else {
        yellow = true;
      }
      continue;
    }

    if (red) {
      results.push({
        name: step.name,
        command: step.command,
        status: 'skipped',
        durationMs: 0
      });
      continue;
    }

    const remainingMs = remainingOverallMs(options.timeoutSeconds, overallStart);
    if (remainingMs !== undefined && remainingMs <= 0) {
      failureCategory = 'timeout';
      results.push({
        name: step.name,
        command: step.command,
        status: 'timeout',
        durationMs: 0
      });
      red = true;
      continue;
    }

    const stepStart = process.hrtime.bigint();
    const timeout = Math.min(options.stepTimeoutSeconds * 1000, remainingMs ?? Number.POSITIVE_INFINITY);

    try {
      const subprocess = execa(step.command[0]!, step.command.slice(1), {
        cwd: plan.workdir,
        env: options.inheritEnv ? { ...process.env, ...options.env } : options.env,
        reject: false,
        timeout,
        all: true
      });

      if (options.verbose && !options.quiet && subprocess.all) {
        subprocess.all.on('data', (chunk) => {
          process.stdout.write(redactText(String(chunk)));
        });
      }

      const result = await subprocess;
      const output = result.all ?? `${result.stdout}\n${result.stderr}`.trim();
      const logPath = await writeStepLog(options.artifactsDir, step.name, output);
      const durationMs = elapsedMs(stepStart);

      if (result.exitCode === 0) {
        if (step.name === 'test') {
          testPassed = true;
        }
        results.push({
          name: step.name,
          command: step.command,
          status: 'passed',
          exitCode: result.exitCode,
          durationMs,
          logPath
        });
      } else {
        failureCategory = classifyFailure({ step: step.name, exitCode: result.exitCode, timedOut: result.timedOut });
        results.push({
          name: step.name,
          command: step.command,
          status: result.timedOut ? 'timeout' : 'failed',
          exitCode: result.exitCode,
          durationMs,
          logPath
        });
        red = true;
      }
    } catch (error) {
      const durationMs = elapsedMs(stepStart);
      const message = error instanceof Error ? error.message : String(error);
      const logPath = await writeStepLog(options.artifactsDir, step.name, message);
      failureCategory = classifyFailure({ step: step.name, failedToStart: true });
      results.push({
        name: step.name,
        command: step.command,
        status: 'failed',
        durationMs,
        logPath
      });
      red = true;
    }
  }

  const endedAt = nowIso();
  const durationMs = elapsedMs(overallStart);
  if (!red && !testPassed) {
    yellow = true;
  }
  const status = red ? 'red' : yellow ? 'yellow' : 'green';
  return {
    status,
    category: failureCategory,
    summary: summaryFor(status, failureCategory),
    startedAt,
    endedAt,
    durationMs,
    steps: results
  };
}

function summaryFor(status: ExecutionResult['status'], category: ExecutionResult['category']): string {
  if (status === 'green') {
    return 'All required setup commands passed and a real test command ran successfully.';
  }
  if (status === 'yellow') {
    if (category === 'no_test_detected') {
      return 'Setup commands passed, but no real test command was detected. This was allowed by flag.';
    }
    return 'Setup commands passed, but the repository only reached a partial confidence state.';
  }
  if (category === 'no_test_detected') {
    return 'No test command was detected. Add one or pass --allow-no-tests to mark this as yellow.';
  }
  if (category === 'timeout') {
    return 'A command timed out before the repository reached green.';
  }
  if (category === 'missing_tool') {
    return 'A required local tool was not available.';
  }
  return `Repository did not reach green${category ? `: ${category}` : ''}.`;
}

function remainingOverallMs(timeoutSeconds: number | undefined, start: bigint): number | undefined {
  if (!timeoutSeconds) {
    return undefined;
  }
  return timeoutSeconds * 1000 - elapsedMs(start);
}

export function planSummary(plan: ExecutionPlan): string {
  return plan.steps
    .map((step) => `${step.name}: ${step.skipped ? step.reason ?? 'skipped' : commandToString(step.command)}`)
    .join('\n');
}
