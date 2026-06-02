import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

describe('Node runtime policy', () => {
  test('pins Node 24 LTS and launch metadata in package files', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

    await expect(readFile('.nvmrc', 'utf8')).resolves.toBe('24\n');
    await expect(readFile('.node-version', 'utf8')).resolves.toBe('24\n');
    await expect(readFile('.npmrc', 'utf8')).resolves.toBe('engine-strict=true\n');
    expect(packageJson.engines.node).toBe('^24.0.0');
    expect(JSON.stringify(packageJson)).not.toContain('your-org');
    expect(packageJson.description).toBe('Clean clone reproducibility checker for developer projects.');
    expect(packageJson.keywords).toContain('reproducibility');
    expect(packageJson.keywords).toContain('fresh-clone');
    expect(packageJson.keywords).toContain('github-actions');
  });
});
