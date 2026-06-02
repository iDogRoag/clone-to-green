import { describe, expect, test } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareWorkspace, resolveSource } from '../src/source.js';

describe('resolveSource', () => {
  test('prefers an existing local path over GitHub shorthand', async () => {
    await expect(resolveSource('examples/node-green')).resolves.toMatchObject({
      kind: 'local'
    });
  });

  test('keeps owner/repo shorthand for non-local paths', async () => {
    await expect(resolveSource('owner/repo')).resolves.toMatchObject({
      kind: 'github',
      resolved: 'https://github.com/owner/repo.git'
    });
  });

  test('copies sources from paths that include node_modules in their parent directories', async () => {
    const root = await mkdtemp(join(tmpdir(), 'ctg-source-'));
    const source = join(root, 'node_modules', 'demo');
    await mkdir(source, { recursive: true });
    await writeFile(join(source, 'package.json'), '{"scripts":{"test":"node --test"}}', 'utf8');

    const prepared = await prepareWorkspace(source);
    try {
      await expect(readFile(join(prepared.workspacePath, 'package.json'), 'utf8')).resolves.toContain('node --test');
    } finally {
      await prepared.cleanup();
      await rm(root, { recursive: true, force: true });
    }
  });
});
