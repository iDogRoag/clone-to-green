import { detectProject } from './detect.js';
import { STEP_NAMES, type CreatePlanOptions, type ExecutionPlan, type ProjectDetection, type StepName } from './types.js';
import { resolveInside } from './utils/path.js';

export async function createPlan(root: string, options: CreatePlanOptions): Promise<ExecutionPlan> {
  const config = options.config ?? {};
  const selectedWorkdir = options.workdir ?? config.workdir ?? '.';
  const workdir = resolveInside(root, selectedWorkdir);
  const profile = options.profile !== 'auto' ? options.profile : config.profile ?? 'auto';
  const detection = await detectProject(workdir, { profile });
  const mergedDetection = applyCommandOverrides(detection, config.commands);
  const skip = {
    install: options.skipInstall ?? config.skip?.install ?? false,
    build: options.skipBuild ?? config.skip?.build ?? false,
    test: options.skipTest ?? config.skip?.test ?? false
  };
  const required = {
    install: config.required?.install,
    build: config.required?.build,
    test: config.required?.test
  };

  return {
    detection: mergedDetection,
    workdir,
    steps: STEP_NAMES.map((name) => createStep(name, mergedDetection, skip[name], required[name]))
  };
}

function applyCommandOverrides(
  detection: ProjectDetection,
  overrides: ProjectDetection['commands'] | undefined
): ProjectDetection {
  if (!overrides) {
    return detection;
  }
  return {
    ...detection,
    reasons: [...detection.reasons, 'config command override applied'],
    commands: {
      ...detection.commands,
      ...overrides
    }
  };
}

function createStep(
  name: StepName,
  detection: ProjectDetection,
  skippedByUser: boolean,
  requiredOverride: boolean | undefined
) {
  const command = detection.commands[name] ?? [];
  const required = requiredOverride ?? defaultRequired(name, command);
  if (skippedByUser) {
    return { name, command, skipped: true, required: false, reason: `${name}_disabled` };
  }
  if (command.length > 0) {
    return { name, command, skipped: false, required };
  }
  if (name === 'test') {
    return { name, command, skipped: true, required, reason: 'no_test_detected' };
  }
  return { name, command, skipped: true, required, reason: required ? 'required_command_missing' : 'no_command' };
}

function defaultRequired(name: StepName, command: string[]): boolean {
  if (name === 'test') {
    return true;
  }
  if (name === 'build') {
    return false;
  }
  return command.length > 0;
}
