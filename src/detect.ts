import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import fg from 'fast-glob';
import type { CommandMap, DetectOptions, ProjectDetection } from './types.js';
import { pathExists } from './utils/fs.js';

export async function detectProject(root: string, options: DetectOptions): Promise<ProjectDetection> {
  const entries = new Set(
    await fg(['*', '.*'], {
      cwd: root,
      dot: true,
      deep: 1,
      onlyFiles: false,
      unique: true
    })
  );

  if (options.profile !== 'auto') {
    return detectByProfile(root, entries, options.profile);
  }

  if (entries.has('package.json')) {
    return detectNode(root, entries);
  }
  if (entries.has('pyproject.toml') || entries.has('requirements.txt') || entries.has('pytest.ini') || entries.has('tox.ini') || entries.has('tests')) {
    return detectPython(entries);
  }
  if (entries.has('go.mod')) {
    return detectGo();
  }
  if (entries.has('Cargo.toml')) {
    return detectRust();
  }
  if (entries.has('Dockerfile')) {
    return detectDocker();
  }

  return {
    profile: 'unknown',
    reasons: ['No supported project marker found in selected working directory.'],
    commands: {}
  };
}

async function detectByProfile(
  root: string,
  entries: Set<string>,
  profile: Exclude<DetectOptions['profile'], 'auto'>
): Promise<ProjectDetection> {
  switch (profile) {
    case 'node':
      return detectNode(root, entries);
    case 'python':
      return detectPython(entries);
    case 'go':
      return detectGo();
    case 'rust':
      return detectRust();
    case 'docker':
      return detectDocker();
    case 'custom':
      return { profile: 'custom', reasons: ['Custom profile selected.'], commands: {} };
  }
}

async function detectNode(root: string, entries: Set<string>): Promise<ProjectDetection> {
  const packageJson = await readPackageJson(join(root, 'package.json'));
  const packageManager = detectNodePackageManager(entries);
  const commands: CommandMap = {
    install: installCommandFor(packageManager, entries)
  };
  const reasons = ['package.json found', packageManagerReason(packageManager, entries)];

  const scripts = packageJson.scripts ?? {};
  if (typeof scripts.build === 'string') {
    commands.build = scriptCommandFor(packageManager, 'build');
    reasons.push('scripts.build found');
  }
  if (typeof scripts.test === 'string' && !isPlaceholderTest(scripts.test)) {
    commands.test = scriptCommandFor(packageManager, 'test');
    reasons.push('scripts.test found');
  }

  return {
    profile: 'node',
    packageManager,
    reasons,
    commands
  };
}

function detectPython(entries: Set<string>): ProjectDetection {
  const commands: CommandMap = {};
  const reasons: string[] = [];

  if (entries.has('requirements.txt')) {
    commands.install = ['python', '-m', 'pip', 'install', '-r', 'requirements.txt'];
    reasons.push('requirements.txt found');
  } else if (entries.has('pyproject.toml')) {
    commands.install = ['python', '-m', 'pip', 'install', '-e', '.'];
    reasons.push('pyproject.toml found');
  }

  if (entries.has('pyproject.toml') || entries.has('pytest.ini') || entries.has('tox.ini') || entries.has('tests')) {
    commands.test = ['python', '-m', 'pytest'];
    reasons.push('pytest signal found');
  }

  return { profile: 'python', reasons, commands };
}

function detectGo(): ProjectDetection {
  return {
    profile: 'go',
    reasons: ['go.mod found'],
    commands: {
      install: ['go', 'mod', 'download'],
      test: ['go', 'test', './...']
    }
  };
}

function detectRust(): ProjectDetection {
  return {
    profile: 'rust',
    reasons: ['Cargo.toml found'],
    commands: {
      install: ['cargo', 'fetch'],
      build: ['cargo', 'build'],
      test: ['cargo', 'test']
    }
  };
}

function detectDocker(): ProjectDetection {
  return {
    profile: 'docker',
    reasons: ['Dockerfile found'],
    commands: {
      build: ['docker', 'build', '-t', 'clone-to-green-check', '.']
    }
  };
}

async function readPackageJson(path: string): Promise<{ scripts?: Record<string, unknown> }> {
  if (!(await pathExists(path))) {
    return {};
  }
  try {
    return JSON.parse(await readFile(path, 'utf8')) as { scripts?: Record<string, unknown> };
  } catch {
    return {};
  }
}

function detectNodePackageManager(entries: Set<string>): 'npm' | 'pnpm' | 'yarn' | 'bun' {
  if (entries.has('package-lock.json') || entries.has('npm-shrinkwrap.json')) {
    return 'npm';
  }
  if (entries.has('pnpm-lock.yaml')) {
    return 'pnpm';
  }
  if (entries.has('yarn.lock')) {
    return 'yarn';
  }
  if (entries.has('bun.lock') || entries.has('bun.lockb')) {
    return 'bun';
  }
  return 'npm';
}

function packageManagerReason(packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun', entries: Set<string>): string {
  if (
    entries.has('package-lock.json') ||
    entries.has('npm-shrinkwrap.json') ||
    entries.has('pnpm-lock.yaml') ||
    entries.has('yarn.lock') ||
    entries.has('bun.lock') ||
    entries.has('bun.lockb')
  ) {
    return `${packageManager} selected by lockfile precedence`;
  }
  return 'npm selected by default because no lockfile was found';
}

function installCommandFor(packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun', entries: Set<string>): string[] {
  switch (packageManager) {
    case 'npm':
      return entries.has('package-lock.json') || entries.has('npm-shrinkwrap.json') ? ['npm', 'ci'] : ['npm', 'install'];
    case 'pnpm':
      return ['pnpm', 'install', '--frozen-lockfile'];
    case 'yarn':
      return ['yarn', 'install', '--frozen-lockfile'];
    case 'bun':
      return ['bun', 'install', '--frozen-lockfile'];
  }
}

function scriptCommandFor(packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun', script: string): string[] {
  if (packageManager === 'npm') {
    return script === 'test' ? ['npm', 'test'] : ['npm', 'run', script];
  }
  if (packageManager === 'pnpm') {
    return script === 'test' ? ['pnpm', 'test'] : ['pnpm', 'run', script];
  }
  if (packageManager === 'yarn') {
    return ['yarn', script];
  }
  return script === 'test' ? ['bun', 'test'] : ['bun', 'run', script];
}

function isPlaceholderTest(script: string): boolean {
  return /no test specified/i.test(script) && /exit\s+1/.test(script);
}
