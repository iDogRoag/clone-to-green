import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import fg from 'fast-glob';
import type {
  ExecutionPlan,
  ExecutionResult,
  PlanStep,
  ReproducibilityConfidence,
  ReproducibilityFinding,
  ReproducibilityScore
} from './types.js';
import { pathExists } from './utils/fs.js';

export async function assessReproducibility(
  plan: ExecutionPlan,
  result: ExecutionResult,
  context: {
    configFilePresent: boolean;
    envFileProvided: boolean;
    workdirProvided: boolean;
    planOnly?: boolean;
  }
): Promise<ReproducibilityScore> {
  const penalties: ReproducibilityFinding[] = [];
  const signals: ReproducibilityFinding[] = [];
  let score = 100;

  const packageJson = await readPackageJson(plan.workdir);
  const lockfilePresent = await hasNodeLockfile(plan.workdir);
  const installStep = findStep(plan.steps, 'install');
  const buildStep = findStep(plan.steps, 'build');
  const testStep = findStep(plan.steps, 'test');
  const realTestRan = result.steps.some((step) => step.name === 'test' && step.status === 'passed');
  const testCommandExists = Boolean(testStep && !testStep.skipped && testStep.command.length > 0);
  const deterministicInstall = isDeterministicInstall(installStep?.command ?? []);
  const envTemplates = await findEnvTemplates(plan.workdir);
  const monorepo = await isMonorepo(plan.workdir, packageJson);
  const buildExpected = await isBuildLikelyExpected(plan.workdir, packageJson);

  if (plan.detection.profile === 'node') {
    if (lockfilePresent) {
      addSignal(signals, 'node_lockfile_present', 'Lockfile present', 'A Node lockfile was found.');
    } else {
      score = addPenalty(penalties, score, 'missing_node_lockfile', 'Missing Node lockfile', 15, 'Node projects are more reproducible with a committed lockfile.');
    }

    if (deterministicInstall) {
      addSignal(signals, 'deterministic_install', 'Deterministic install', 'The install command uses a frozen or lockfile-based mode.');
    } else if (installStep?.command.length) {
      score = addPenalty(
        penalties,
        score,
        'non_deterministic_install',
        'Non-deterministic install',
        15,
        'The install command may update dependency resolution.'
      );
    }

    if (!lockfilePresent && plan.detection.packageManager === 'npm') {
      score = addPenalty(
        penalties,
        score,
        'package_manager_guessed',
        'Package manager guessed',
        10,
        'No package manager lockfile was present, so npm was selected by default.'
      );
    }
  }

  if (testCommandExists) {
    addSignal(signals, 'test_command_exists', 'Test command exists', 'A real test command was detected.');
  } else {
    score = addPenalty(
      penalties,
      score,
      'no_real_test_command',
      'No real test command',
      20,
      'No real test command was detected.'
    );
  }

  if (realTestRan || context.planOnly) {
    addSignal(
      signals,
      context.planOnly ? 'real_test_command_planned' : 'real_test_command_ran',
      context.planOnly ? 'Real test command planned' : 'Real test command ran',
      context.planOnly ? 'The plan includes a test command.' : 'A real test command ran successfully.'
    );
  } else {
    score = addPenalty(
      penalties,
      score,
      'real_test_command_not_run',
      'Real test command did not run',
      20,
      'Green confidence requires a real test command to run successfully.'
    );
  }

  if (buildStep && !buildStep.skipped) {
    addSignal(signals, 'build_command_exists', 'Build command exists', 'A build command was detected.');
  } else if (buildExpected) {
    score = addPenalty(
      penalties,
      score,
      'missing_expected_build',
      'Expected build missing',
      10,
      'The project appears to need a build command, but none was detected.'
    );
  } else {
    addSignal(signals, 'build_not_expected', 'Build not expected', 'No build command appears necessary for this project.');
  }

  if (envTemplates.length === 0) {
    addSignal(signals, 'no_env_template_detected', 'No env template detected', 'No env template file was found.');
  } else if (context.envFileProvided) {
    addSignal(signals, 'env_template_with_env_file', 'Env file provided', 'Env templates were found and an env file was provided.');
  } else {
    score = addPenalty(
      penalties,
      score,
      'env_template_without_env_file',
      'Env template without env file',
      10,
      'Env templates were found but no env file was passed.'
    );
  }

  if (monorepo && !context.workdirProvided && !context.configFilePresent) {
    score = addPenalty(
      penalties,
      score,
      'monorepo_ambiguity',
      'Monorepo ambiguity',
      10,
      'A monorepo signal was detected without --workdir or config.'
    );
  } else {
    addSignal(signals, 'no_monorepo_ambiguity', 'No monorepo ambiguity', 'No unresolved monorepo routing issue was detected.');
  }

  if (!context.configFilePresent && plan.detection.profile !== 'node') {
    score = addPenalty(
      penalties,
      score,
      'missing_config_medium_confidence',
      'Config missing for medium-confidence detection',
      5,
      'A config file would make this detection more explicit.'
    );
  }

  if (plan.steps.some((step) => step.skipped && step.reason !== 'no_test_detected')) {
    score = addPenalty(penalties, score, 'optional_steps_skipped', 'Optional steps skipped', 5, 'At least one optional step was skipped.');
  }

  if (result.category === 'missing_tool') {
    score = addPenalty(penalties, score, 'missing_system_tool', 'Missing system tool', 10, 'A required local tool was missing.');
  } else {
    addSignal(signals, 'no_missing_system_tool', 'No missing system tool observed', 'No missing local tool failure was observed.');
  }

  if (result.category === 'timeout') {
    score = addPenalty(penalties, score, 'timeout', 'Timeout', 10, 'A command timed out.');
  }

  addSignal(signals, 'no_private_package_auth_failure', 'No private package auth failure observed', 'No private package auth failure was observed.');
  addSignal(signals, 'no_network_registry_failure', 'No network or registry failure observed', 'No network or registry failure was observed.');
  addSignal(signals, 'no_hidden_service_dependency', 'No hidden service dependency observed', 'No hidden local service dependency was observed.');
  addSignal(signals, 'no_postinstall_failure', 'No postinstall failure observed', 'No postinstall failure was observed.');
  addSignal(signals, 'no_uncommitted_local_copy_mode', 'No uncommitted local copy mode', 'No explicit uncommitted-copy mode was used.');
  addSignal(signals, 'no_fallback_command_used', 'No fallback command used', 'No fallback command was needed.');

  const clamped = Math.max(0, Math.min(100, score));
  return {
    score: clamped,
    confidence: confidenceFor(clamped, result.status),
    signals,
    penalties
  };
}

function findStep(steps: PlanStep[], name: PlanStep['name']): PlanStep | undefined {
  return steps.find((step) => step.name === name);
}

function addSignal(signals: ReproducibilityFinding[], id: string, label: string, message: string): void {
  signals.push({ id, label, points: 0, message });
}

function addPenalty(
  penalties: ReproducibilityFinding[],
  score: number,
  id: string,
  label: string,
  points: number,
  message: string
): number {
  penalties.push({ id, label, points: -points, message });
  return score - points;
}

function confidenceFor(score: number, status: ExecutionResult['status']): ReproducibilityConfidence {
  if (status === 'red' && score >= 90) {
    return 'good';
  }
  if (score >= 90) {
    return 'strong';
  }
  if (score >= 70) {
    return 'good';
  }
  if (score >= 50) {
    return 'fragile';
  }
  return 'weak';
}

function isDeterministicInstall(command: string[]): boolean {
  const joined = command.join(' ');
  return (
    joined === 'npm ci' ||
    joined.includes('--frozen-lockfile') ||
    joined === 'cargo fetch' ||
    joined === 'go mod download'
  );
}

async function hasNodeLockfile(root: string): Promise<boolean> {
  return (
    (await pathExists(join(root, 'package-lock.json'))) ||
    (await pathExists(join(root, 'npm-shrinkwrap.json'))) ||
    (await pathExists(join(root, 'pnpm-lock.yaml'))) ||
    (await pathExists(join(root, 'yarn.lock'))) ||
    (await pathExists(join(root, 'bun.lock'))) ||
    (await pathExists(join(root, 'bun.lockb')))
  );
}

async function findEnvTemplates(root: string): Promise<string[]> {
  return fg(['.env.example', '.env.sample', '.env.template', '.env.*.example', '.env.*.sample'], {
    cwd: root,
    dot: true,
    onlyFiles: true
  });
}

async function isMonorepo(root: string, packageJson: Record<string, unknown> | undefined): Promise<boolean> {
  if (await pathExists(join(root, 'pnpm-workspace.yaml'))) {
    return true;
  }
  if (await pathExists(join(root, 'turbo.json')) || await pathExists(join(root, 'nx.json'))) {
    return true;
  }
  return Boolean(packageJson && 'workspaces' in packageJson);
}

async function isBuildLikelyExpected(root: string, packageJson: Record<string, unknown> | undefined): Promise<boolean> {
  if (packageJson?.scripts && typeof packageJson.scripts === 'object' && 'build' in packageJson.scripts) {
    return true;
  }
  return (await pathExists(join(root, 'tsconfig.json'))) || (await pathExists(join(root, 'src')));
}

async function readPackageJson(root: string): Promise<Record<string, unknown> | undefined> {
  try {
    return JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
