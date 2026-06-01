import { describe, expect, test } from 'vitest';
import { fileURLToPath } from 'node:url';
import { findConfigFile, loadConfigFile, parseCommand } from '../src/config.js';

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url));

describe('config', () => {
  test('loads valid config and normalizes command strings and arrays', async () => {
    const config = await loadConfigFile(`${fixture}configured/clone-to-green.yml`);

    expect(config.profile).toBe('custom');
    expect(config.commands?.install).toEqual(['npm', 'ci']);
    expect(config.commands?.build).toEqual(['npm', 'run', 'build']);
    expect(config.env?.NODE_ENV).toBe('test');
  });

  test('normalizes single-item command arrays as command strings', async () => {
    const config = await loadConfigFile(`${fixture}configured-single-line/clone-to-green.yml`);

    expect(config.commands?.install).toEqual(['npm', 'ci']);
    expect(config.commands?.build).toEqual(['npm', 'run', 'build', '--if-present']);
    expect(config.required?.build).toBe(false);
  });

  test('rejects invalid command values', async () => {
    await expect(loadConfigFile(`${fixture}bad-config/clone-to-green.yml`)).rejects.toThrow(/Invalid config/);
  });

  test('finds default config names in order', async () => {
    await expect(findConfigFile(`${fixture}configured`)).resolves.toMatch(/clone-to-green\.yml$/);
  });

  test('parses quoted command strings', () => {
    expect(parseCommand('npm run test -- --grep "smoke path"')).toEqual([
      'npm',
      'run',
      'test',
      '--',
      '--grep',
      'smoke path'
    ]);
  });
});
