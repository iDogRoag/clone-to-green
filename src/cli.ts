#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Command, CommanderError, InvalidArgumentError } from 'commander';
import { loadConfigForRoot } from './config.js';
import { detectProject } from './detect.js';
import { buildChildEnv, loadEnvFile, parseEnvAssignments } from './env.js';
import { createPlan } from './planner.js';
import { assessReproducibility } from './reproducibility.js';
import { renderHtmlReport } from './reporters/html.js';
import { renderJsonReport } from './reporters/json.js';
import { renderMarkdownReport } from './reporters/markdown.js';
import { renderTableReport } from './reporters/table.js';
import { executePlan } from './runner.js';
import { isRemoteSource, prepareWorkspace, resolveSource } from './source.js';
import {
  OUTPUT_FORMATS,
  PROFILES,
  VERSION,
  type CliIo,
  type CloneToGreenConfig,
  type CloneToGreenReport,
  type DoctorToolResult,
  type ExecutionPlan,
  type ExecutionResult,
  type OutputFormat,
  type PreparedWorkspace,
  type Profile,
  type ReproducibilityScore,
  type SourceInfo,
  type WorkspaceInfo
} from './types.js';
import { commandVersion } from './utils/exec.js';
import { ensureParentDir, pathExists } from './utils/fs.js';
import { commandToString, resolveInside } from './utils/path.js';
import { redactCommand, redactText } from './utils/redact.js';
import { nowIso } from './utils/time.js';

type CommonOptions = {
  format: OutputFormat;
  output?: string;
  config?: string;
  workdir?: string;
  profile: Profile;
  timeout: number;
  stepTimeout: number;
  keepWorkspace?: boolean;
  artifactsDir?: string;
  env?: string[];
  envFile?: string;
  inheritEnv?: boolean;
  install?: boolean;
  build?: boolean;
  test?: boolean;
  ci?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  yes?: boolean;
  allowNoTests?: boolean;
  failOnYellow?: boolean;
};

type InitOptions = {
  force?: boolean;
  profile: Profile;
};

type DemoOptions = {
  green?: boolean;
  red?: boolean;
  badge?: boolean;
  format: OutputFormat;
  output?: string;
};

const ioDefaults: Required<CliIo> = {
  stdout: (chunk) => {
    process.stdout.write(chunk);
  },
  stderr: (chunk) => {
    process.stderr.write(chunk);
  }
};

export async function runCli(argv = process.argv, io: CliIo = {}): Promise<number> {
  const streams = { ...ioDefaults, ...io };
  const program = new Command();
  let requestedExitCode = 0;

  program
    .name('clone-to-green')
    .description('Prove a repo can be cloned from scratch and reach green without hidden local setup.')
    .version(VERSION)
    .exitOverride()
    .addHelpText(
      'after',
      `

Exit codes:
  0  green, or yellow without --fail-on-yellow
  1  red, or yellow with --fail-on-yellow
  2  invalid usage, invalid config, unreadable source, missing source, or internal error
  3  missing required local tool
  4  timeout
`
    )
    .configureOutput({
      writeOut: streams.stdout,
      writeErr: streams.stderr
    });

  addRunLikeOptions(
    program
      .command('run')
      .argument('[source]', 'local path, git URL, or GitHub owner/repo shorthand', '.')
      .description('Run a full fresh-workspace clone check.')
      .action(async (source: string, options: CommonOptions) => {
        requestedExitCode = await handleRun(source, normalizeCommonOptions(options), streams);
      })
  );

  addRunLikeOptions(
    program
      .command('plan')
      .argument('[source]', 'local path, git URL, or GitHub owner/repo shorthand', '.')
      .description('Inspect and print the detected plan without running commands.')
      .action(async (source: string, options: CommonOptions) => {
        requestedExitCode = await handlePlan(source, normalizeCommonOptions(options), streams);
      })
  );

  program
    .command('init')
    .argument('[path]', 'repository path', '.')
    .description('Create a starter clone-to-green.yml.')
    .option('--force', 'overwrite an existing config')
    .option('--profile <profile>', 'profile to prefer', parseProfile, 'auto')
    .action(async (targetPath: string, options: InitOptions) => {
      requestedExitCode = await handleInit(targetPath, options, streams);
    });

  program
    .command('doctor')
    .description('Check local machine prerequisites.')
    .option('--format <format>', 'output format', parseFormat, 'table')
    .action(async (options: { format: OutputFormat }) => {
      requestedExitCode = await handleDoctor(options.format, streams);
    });

  program
    .command('demo')
    .description('Run a bundled demo report without needing a target repo.')
    .option('--green', 'show a passing demo repo')
    .option('--red', 'show a failing or missing-tests demo repo')
    .option('--badge', 'print a Markdown status badge')
    .option('--format <format>', 'table, json, markdown, or html', parseFormat, 'table')
    .option('--output <file>', 'write the demo report to a file')
    .action(async (options: DemoOptions) => {
      requestedExitCode = await handleDemo(options, streams);
    });

  try {
    await program.parseAsync(argv);
    return requestedExitCode;
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.exitCode === 0 ? 0 : 2;
    }
    streams.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

async function handleDemo(options: DemoOptions, io: Required<CliIo>): Promise<number> {
  const useRedDemo = Boolean(options.red);

  if (options.badge) {
    const status = useRedDemo ? 'red' : 'green';
    const color = status === 'green' ? 'brightgreen' : 'red';
    io.stdout(`![Clone To Green](https://img.shields.io/badge/clone--to--green-${status}-${color})\n`);
    return 0;
  }

  const example = useRedDemo ? 'node-missing-tests' : 'node-green';
  const source = bundledExamplePath(example);
  return handleRun(
    source,
    {
      ...defaultCommonOptions(),
      format: options.format,
      output: options.output,
      install: !useRedDemo,
      allowNoTests: false,
      failOnYellow: false
    },
    io
  );
}

async function handleRun(sourceInput: string, options: CommonOptions, io: Required<CliIo>): Promise<number> {
  let workspace: PreparedWorkspace | undefined;
  try {
    const source = await resolveSource(sourceInput);
    if (isRemoteSource(source) && !options.yes && !options.ci) {
      io.stderr(
        'Clone To Green runs install, build, and test commands from the target repository. That means arbitrary code execution. Only run it on code you trust, or run it inside your own isolated environment. Re-run with --yes to confirm this remote repository.\n'
      );
      return 2;
    }

    workspace = await prepareWorkspace(sourceInput);
    const configInfo = await loadConfigForRoot(workspace.workspacePath, options.config);
    const { config } = configInfo;
    const plan = await planForWorkspace(workspace.workspacePath, options, config);
    const envFile = options.envFile ? await loadEnvFile(resolveInside(workspace.workspacePath, options.envFile)) : undefined;
    const env = buildChildEnv({
      inheritEnv: Boolean(options.inheritEnv),
      envFile,
      explicitEnv: {
        ...(config.env ?? {}),
        ...parseEnvAssignments(options.env)
      }
    });
    const result = await executePlan(plan, {
      stepTimeoutSeconds: options.stepTimeout,
      timeoutSeconds: options.timeout,
      artifactsDir: options.artifactsDir ? resolveInside(process.cwd(), options.artifactsDir) : undefined,
      env,
      inheritEnv: Boolean(options.inheritEnv),
      verbose: Boolean(options.verbose),
      quiet: Boolean(options.quiet),
      allowNoTests: Boolean(options.allowNoTests)
    });
    const reproducibility = await assessReproducibility(plan, result, {
      configFilePresent: Boolean(configInfo.path),
      envFileProvided: Boolean(options.envFile),
      workdirProvided: Boolean(options.workdir || config.workdir)
    });
    const finalResult = applyReproducibilityStatus(result, reproducibility);
    const report = makeReport(workspace.source, workspace, plan, finalResult, reproducibility, options.keepWorkspace ?? false);
    await emitReport(report, options, io);
    return exitCodeFor(finalResult, options);
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  } finally {
    if (workspace && !options.keepWorkspace) {
      await workspace.cleanup();
    } else if (workspace?.workspacePath) {
      io.stderr(`Workspace kept at ${workspace.workspacePath}\n`);
    }
  }
}

async function handlePlan(sourceInput: string, options: CommonOptions, io: Required<CliIo>): Promise<number> {
  let workspace: PreparedWorkspace | undefined;
  try {
    workspace = await prepareWorkspace(sourceInput);
    const configInfo = await loadConfigForRoot(workspace.workspacePath, options.config);
    const { config } = configInfo;
    const plan = await planForWorkspace(workspace.workspacePath, options, config);
    const now = nowIso();
    const result: ExecutionResult = {
      status: 'green',
      summary: 'Plan created. No commands were run.',
      startedAt: now,
      endedAt: now,
      durationMs: 0,
      steps: []
    };
    const reproducibility = await assessReproducibility(plan, result, {
      configFilePresent: Boolean(configInfo.path),
      envFileProvided: Boolean(options.envFile),
      workdirProvided: Boolean(options.workdir || config.workdir),
      planOnly: true
    });
    const report = makeReport(workspace.source, workspace, plan, result, reproducibility, options.keepWorkspace ?? false);
    await emitReport(report, options, io);
    return 0;
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  } finally {
    if (workspace && !options.keepWorkspace) {
      await workspace.cleanup();
    } else if (workspace?.workspacePath) {
      io.stderr(`Workspace kept at ${workspace.workspacePath}\n`);
    }
  }
}

async function handleInit(targetPath: string, options: InitOptions, io: Required<CliIo>): Promise<number> {
  try {
    const root = isAbsolute(targetPath) ? targetPath : resolveInside(process.cwd(), targetPath);
    const configPath = join(root, 'clone-to-green.yml');
    if ((await pathExists(configPath)) && !options.force) {
      io.stderr('clone-to-green.yml already exists. Use --force to overwrite.\n');
      return 2;
    }
    const detection = await detectProject(root, { profile: options.profile });
    const config = starterConfig(detection.commands, options.profile === 'auto' ? detection.profile : options.profile);
    await writeFile(configPath, config, 'utf8');
    io.stdout(`Created ${configPath}\n`);
    return 0;
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

async function handleDoctor(format: OutputFormat, io: Required<CliIo>): Promise<number> {
  const tools: Array<[string, string[]]> = [
    ['git', ['--version']],
    ['node', ['--version']],
    ['npm', ['--version']],
    ['corepack', ['--version']],
    ['pnpm', ['--version']],
    ['yarn', ['--version']],
    ['bun', ['--version']],
    ['python', ['--version']],
    ['pip', ['--version']],
    ['uv', ['--version']],
    ['poetry', ['--version']],
    ['go', ['version']],
    ['cargo', ['--version']],
    ['docker', ['--version']]
  ];

  const results: DoctorToolResult[] = [];
  for (const [name, args] of tools) {
    results.push({ name, ...(await commandVersion(name, args)) });
  }

  if (format === 'json') {
    io.stdout(`${JSON.stringify({ tools: results }, null, 2)}\n`);
  } else if (format === 'markdown') {
    io.stdout(renderDoctorMarkdown(results));
  } else if (format === 'html') {
    io.stdout(renderDoctorHtml(results));
  } else {
    io.stdout(renderDoctorTable(results));
  }
  return 0;
}

async function planForWorkspace(
  workspacePath: string,
  options: CommonOptions,
  config: CloneToGreenConfig
): Promise<ExecutionPlan> {
  return createPlan(workspacePath, {
    profile: options.profile,
    workdir: options.workdir,
    config,
    skipInstall: options.install === false,
    skipBuild: options.build === false,
    skipTest: options.test === false
  });
}

function makeReport(
  source: SourceInfo,
  workspace: PreparedWorkspace,
  plan: ExecutionPlan,
  result: ExecutionResult,
  reproducibility: ReproducibilityScore,
  keepWorkspace: boolean
): CloneToGreenReport {
  const workspaceInfo: WorkspaceInfo = {
    path: workspace.workspacePath,
    kept: keepWorkspace,
    workdir: plan.workdir
  };
  return {
    tool: 'clone-to-green',
    version: VERSION,
    source: {
      input: redactText(source.input),
      kind: source.kind,
      resolved: redactText(source.resolved)
    },
    workspace: workspaceInfo,
    detection: {
      profile: plan.detection.profile,
      packageManager: plan.detection.packageManager,
      reasons: plan.detection.reasons.map(redactText)
    },
    plan: {
      steps: plan.steps.map((step) => ({
        ...step,
        command: redactCommand(step.command)
      }))
    },
    reproducibility,
    result: {
      status: result.status,
      category: result.category,
      summary: redactText(result.summary),
      startedAt: result.startedAt,
      endedAt: result.endedAt,
      durationMs: result.durationMs
    },
    steps: result.steps.map((step) => ({
      ...step,
      command: redactCommand(step.command),
      logPath: step.logPath ? redactText(step.logPath) : undefined
    }))
  };
}

function applyReproducibilityStatus(result: ExecutionResult, reproducibility: ReproducibilityScore): ExecutionResult {
  if (result.status !== 'green') {
    return {
      ...result,
      summary: result.summary
    };
  }
  if (reproducibility.score < 70) {
    return {
      ...result,
      status: 'yellow',
      summary: `All required commands passed, but reproducibility confidence is ${reproducibility.confidence}.`
    };
  }
  return result;
}

function exitCodeFor(result: ExecutionResult, options: CommonOptions): number {
  if (result.status === 'green') {
    return 0;
  }
  if (result.status === 'yellow') {
    return options.failOnYellow ? 1 : 0;
  }
  if (result.category === 'missing_tool') {
    return 3;
  }
  if (result.category === 'timeout') {
    return 4;
  }
  return 1;
}

async function emitReport(report: CloneToGreenReport, options: CommonOptions, io: Required<CliIo>): Promise<void> {
  const rendered = renderReport(report, options.format, !options.ci);
  if (options.output) {
    const outputPath = resolveInside(process.cwd(), options.output);
    await ensureParentDir(outputPath);
    await writeFile(outputPath, rendered, 'utf8');
    if (!options.quiet) {
      io.stdout(`Wrote ${outputPath}\n`);
    }
    return;
  }
  if (!options.quiet || report.result.status !== 'green') {
    io.stdout(rendered);
  }
}

function renderReport(report: CloneToGreenReport, format: OutputFormat, color: boolean): string {
  if (format === 'json') {
    return renderJsonReport(report);
  }
  if (format === 'markdown') {
    return renderMarkdownReport(report);
  }
  if (format === 'html') {
    return renderHtmlReport(report);
  }
  return renderTableReport(report, { color });
}

function addRunLikeOptions(command: Command): Command {
  return command
    .option('--format <format>', 'table, json, markdown, or html', parseFormat, 'table')
    .option('--output <file>', 'write the report to a file')
    .option('--config <file>', 'use a config file')
    .option('--workdir <path>', 'run detection and commands in a subdirectory')
    .option('--profile <profile>', 'auto, node, python, go, rust, docker, or custom', parseProfile, 'auto')
    .option('--timeout <seconds>', 'overall run timeout; timeout exits 4', parsePositiveInt, 900)
    .option('--step-timeout <seconds>', 'per-command timeout; timeout exits 4', parsePositiveInt, 300)
    .option('--keep-workspace', 'do not delete the temporary workspace')
    .option('--artifacts-dir <path>', 'save logs and reports to a directory')
    .option('--env <KEY=value>', 'pass an environment variable to commands', collect, [])
    .option('--env-file <path>', 'load environment variables from a dotenv-style file')
    .option('--inherit-env', 'pass the full parent environment to child commands')
    .option('--no-install', 'skip install step')
    .option('--no-build', 'skip build step')
    .option('--no-test', 'skip test step')
    .option('--ci', 'disable prompts and use machine-friendly defaults')
    .option('--verbose', 'print command output live')
    .option('--quiet', 'only print final result and errors')
    .option('--yes', 'confirm execution for remote repositories')
    .option('--allow-no-tests', 'treat missing tests as yellow instead of red; yellow exits 0 by default')
    .option('--fail-on-yellow', 'exit 1 when the final status is yellow');
}

function defaultCommonOptions(): CommonOptions {
  return {
    format: 'table',
    profile: 'auto',
    timeout: 900,
    stepTimeout: 300,
    env: [],
    install: true,
    build: true,
    test: true
  };
}

function normalizeCommonOptions(options: CommonOptions): CommonOptions {
  return {
    ...options,
    yes: Boolean(options.yes || options.ci),
    format: options.ci && options.format === 'table' ? 'json' : options.format
  };
}

function parseFormat(value: string): OutputFormat {
  if (!OUTPUT_FORMATS.includes(value as OutputFormat)) {
    throw new InvalidArgumentError(`Expected one of: ${OUTPUT_FORMATS.join(', ')}`);
  }
  return value as OutputFormat;
}

function parseProfile(value: string): Profile {
  if (!PROFILES.includes(value as Profile)) {
    throw new InvalidArgumentError(`Expected one of: ${PROFILES.join(', ')}`);
  }
  return value as Profile;
}

function parsePositiveInt(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError('Expected a positive integer.');
  }
  return parsed;
}

function collect(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}

function starterConfig(commands: Partial<Record<'install' | 'build' | 'test', string[]>>, profile: string): string {
  const install = commandToString(commands.install ?? []);
  const test = commandToString(commands.test ?? []);
  const build = profile === 'node' ? 'npm run build --if-present' : commandToString(commands.build ?? []);
  const lines = [
    'version: 1',
    '',
    '# Run commands from this directory after Clone To Green creates a fresh workspace.',
    'workdir: .',
    '',
    `profile: ${profile}`,
    '',
    'commands:'
  ];
  if (install) {
    lines.push('  install:', `    - ${install}`);
  }
  if (build) {
    lines.push('  build:', `    - ${build}`);
  }
  if (test) {
    lines.push('  test:', `    - ${test}`);
  }
  lines.push('', 'required:', `  install: ${Boolean(install)}`, '  build: false', '  test: true', '');
  return lines.join('\n');
}

function renderDoctorTable(results: DoctorToolResult[]): string {
  const lines = ['Clone To Green Doctor', '', 'Tool       Status     Version/Error'];
  for (const result of results) {
    lines.push(`${result.name.padEnd(10)} ${result.available ? 'available ' : 'missing   '} ${result.version ?? result.error ?? ''}`);
  }
  return `${lines.join('\n')}\n`;
}

function renderDoctorMarkdown(results: DoctorToolResult[]): string {
  return [
    '# Clone To Green Doctor',
    '',
    '| Tool | Available | Version/Error |',
    '| --- | --- | --- |',
    ...results.map((result) => `| ${result.name} | ${result.available ? 'yes' : 'no'} | \`${result.version ?? result.error ?? ''}\` |`),
    ''
  ].join('\n');
}

function renderDoctorHtml(results: DoctorToolResult[]): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Clone To Green Doctor</title></head>
<body>
<h1>Clone To Green Doctor</h1>
<table>
<thead><tr><th>Tool</th><th>Available</th><th>Version/Error</th></tr></thead>
<tbody>
${results
  .map(
    (result) =>
      `<tr><td>${escapeHtml(result.name)}</td><td>${result.available ? 'yes' : 'no'}</td><td>${escapeHtml(result.version ?? result.error ?? '')}</td></tr>`
  )
  .join('\n')}
</tbody>
</table>
</body>
</html>
`;
}

function bundledExamplePath(name: string): string {
  return fileURLToPath(new URL(`../examples/${name}`, import.meta.url));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isCliEntrypoint(): boolean {
  if (!process.argv[1]) {
    return false;
  }
  try {
    const invokedPath = pathToFileURL(realpathSync(process.argv[1])).href;
    const modulePath = pathToFileURL(realpathSync(fileURLToPath(import.meta.url))).href;
    return invokedPath === modulePath;
  } catch {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  }
}

if (isCliEntrypoint()) {
  runCli(process.argv).then((code) => {
    process.exitCode = code;
  });
}
