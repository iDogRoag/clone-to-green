import { cp, mkdir, stat } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { execa } from 'execa';
import type { PreparedWorkspace, SourceInfo } from './types.js';
import { pathExists } from './utils/fs.js';
import { createTempRoot, removeWorkspace } from './workspace.js';

const COPY_EXCLUDES = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  '.cache',
  '.turbo',
  '.next',
  '.DS_Store'
]);

export async function resolveSource(input = '.'): Promise<SourceInfo> {
  if (isGitHubShorthand(input)) {
    return {
      input,
      kind: 'github',
      resolved: `https://github.com/${input}.git`
    };
  }

  if (isGitUrl(input)) {
    return { input, kind: 'git', resolved: input };
  }

  const resolved = resolve(input);
  if (!(await pathExists(resolved))) {
    throw new Error(`Source does not exist: ${input}`);
  }
  const sourceStat = await stat(resolved);
  if (!sourceStat.isDirectory()) {
    throw new Error(`Source must be a directory or git URL: ${input}`);
  }
  return { input, kind: 'local', resolved };
}

export async function prepareWorkspace(input = '.'): Promise<PreparedWorkspace> {
  const source = await resolveSource(input);
  const tempRoot = await createTempRoot();
  const workspacePath = join(tempRoot, safeWorkspaceName(source));

  try {
    if (source.kind === 'local') {
      await copyLocalSource(source.resolved, workspacePath);
    } else {
      await cloneRemoteSource(source.resolved, workspacePath);
    }
  } catch (error) {
    await removeWorkspace(tempRoot);
    throw new Error(`Failed to prepare workspace: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    source,
    workspacePath,
    tempRoot,
    cleanup: async () => {
      await removeWorkspace(tempRoot);
    }
  };
}

export function isRemoteSource(source: SourceInfo): boolean {
  return source.kind === 'git' || source.kind === 'github';
}

async function copyLocalSource(sourcePath: string, workspacePath: string): Promise<void> {
  await mkdir(workspacePath, { recursive: true });
  await cp(sourcePath, workspacePath, {
    recursive: true,
    filter: (path) => {
      const parts = path.split(/[\\/]/);
      return !parts.some((part) => COPY_EXCLUDES.has(part));
    }
  });
}

async function cloneRemoteSource(url: string, workspacePath: string): Promise<void> {
  await execa('git', ['clone', '--depth', '1', url, workspacePath], {
    reject: true,
    all: true
  });
}

function isGitHubShorthand(input: string): boolean {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(input);
}

function isGitUrl(input: string): boolean {
  return (
    /^https?:\/\/.+/.test(input) ||
    /^git@[^:]+:.+/.test(input) ||
    /^ssh:\/\/.+/.test(input) ||
    input.endsWith('.git')
  );
}

function safeWorkspaceName(source: SourceInfo): string {
  if (source.kind === 'local') {
    return basename(source.resolved) || 'repo';
  }
  return 'repo';
}
