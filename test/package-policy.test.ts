import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import { VERSION } from '../src/types.js';

describe('Node runtime policy', () => {
  test('pins Node 24 LTS and launch metadata in package files', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
    const repositoryUrl =
      typeof packageJson.repository === 'string' ? packageJson.repository : packageJson.repository?.url;
    const normalizedRepositoryUrl = repositoryUrl.replace(/^git\+/, '').replace(/\.git$/, '');
    const requiredKeywords = [
      'developer-tools',
      'testing',
      'ci',
      'automation',
      'onboarding',
      'reproducibility',
      'fresh-clone',
      'smoke-test',
      'oss',
      'nodejs',
      'python',
      'go',
      'rust',
      'github-actions'
    ];

    await expect(readFile('.nvmrc', 'utf8')).resolves.toBe('24\n');
    await expect(readFile('.node-version', 'utf8')).resolves.toBe('24\n');
    await expect(readFile('.npmrc', 'utf8')).resolves.toBe('engine-strict=true\n');
    expect(packageJson.name).toBe('clone-to-green');
    expect(packageJson.version).toBe('0.1.2');
    expect(VERSION).toBe('0.1.2');
    expect(packageJson.engines.node).toBe('^24.0.0');
    expect(packageJson.bin).toEqual({
      'clone-to-green': 'dist/cli.js',
      ctg: 'dist/cli.js'
    });
    expect(normalizedRepositoryUrl).toBe('https://github.com/iDogRoag/clone-to-green');
    expect(packageJson.bugs.url).toBe('https://github.com/iDogRoag/clone-to-green/issues');
    expect(packageJson.homepage).toBe('https://github.com/iDogRoag/clone-to-green#readme');
    expect(JSON.stringify(packageJson)).not.toContain('your-org');
    expect(packageJson.description).toBe('Clean clone reproducibility checker for developer projects.');
    for (const keyword of requiredKeywords) {
      expect(packageJson.keywords).toContain(keyword);
    }
  });
});
