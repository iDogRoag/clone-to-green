import { describe, expect, test } from 'vitest';
import { fileURLToPath } from 'node:url';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from '../src/cli.js';

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url));

describe('cli', () => {
  test('plan prints machine-readable json without running commands', async () => {
    let stdout = '';
    const exitCode = await runCli(['node', 'ctg', 'plan', `${fixture}node-pass`, '--format', 'json'], {
      stdout: (chunk) => {
        stdout += chunk;
      },
      stderr: () => {}
    });

    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      detection: { profile: 'node' },
      plan: { steps: expect.any(Array) }
    });
  });

  test('doctor reports available and missing tools as json', async () => {
    let stdout = '';
    const exitCode = await runCli(['node', 'ctg', 'doctor', '--format', 'json'], {
      stdout: (chunk) => {
        stdout += chunk;
      },
      stderr: () => {}
    });

    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout).tools).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'node' })]));
  });

  test('demo prints a default report without requiring a target repo', async () => {
    let stdout = '';
    const exitCode = await runCli(['node', 'ctg', 'demo', '--format', 'json'], {
      stdout: (chunk) => {
        stdout += chunk;
      },
      stderr: () => {}
    });

    const report = JSON.parse(stdout);
    expect(exitCode).toBe(1);
    expect(report.source.input).toContain('examples/node-missing-tests');
    expect(report.result.status).toBe('red');
    expect(report.reproducibility.penalties.map((penalty: { id: string }) => penalty.id)).toContain('no_real_test_command');
  });

  test('demo --green uses the bundled passing example', async () => {
    let stdout = '';
    const exitCode = await runCli(['node', 'ctg', 'demo', '--green', '--format', 'json'], {
      stdout: (chunk) => {
        stdout += chunk;
      },
      stderr: () => {}
    });

    const report = JSON.parse(stdout);
    expect(exitCode).toBe(0);
    expect(report.source.input).toContain('examples/node-green');
    expect(report.result.status).toBe('green');
  });

  test('demo --badge prints markdown badge text', async () => {
    let stdout = '';
    const exitCode = await runCli(['node', 'ctg', 'demo', '--badge'], {
      stdout: (chunk) => {
        stdout += chunk;
      },
      stderr: () => {}
    });

    expect(exitCode).toBe(0);
    expect(stdout).toContain('![Clone To Green]');
    expect(stdout).toContain('clone--to--green');
  });

  test('run treats missing tests as red by default', async () => {
    let stdout = '';
    const exitCode = await runCli(['node', 'ctg', 'run', `${fixture}node-no-tests`, '--no-install', '--format', 'json'], {
      stdout: (chunk) => {
        stdout += chunk;
      },
      stderr: () => {}
    });

    const report = JSON.parse(stdout);
    expect(exitCode).toBe(1);
    expect(report.result.status).toBe('red');
    expect(report.result.category).toBe('no_test_detected');
    expect(report.reproducibility.penalties.map((penalty: { id: string }) => penalty.id)).toContain('no_real_test_command');
  });

  test('run can downgrade missing tests to yellow and fail yellow on demand', async () => {
    let yellowStdout = '';
    const yellowExit = await runCli(
      ['node', 'ctg', 'run', `${fixture}node-no-tests`, '--no-install', '--allow-no-tests', '--format', 'json'],
      {
        stdout: (chunk) => {
          yellowStdout += chunk;
        },
        stderr: () => {}
      }
    );

    let failStdout = '';
    const failExit = await runCli(
      [
        'node',
        'ctg',
        'run',
        `${fixture}node-no-tests`,
        '--no-install',
        '--allow-no-tests',
        '--fail-on-yellow',
        '--format',
        'json'
      ],
      {
        stdout: (chunk) => {
          failStdout += chunk;
        },
        stderr: () => {}
      }
    );

    expect(yellowExit).toBe(0);
    expect(JSON.parse(yellowStdout).result.status).toBe('yellow');
    expect(failExit).toBe(1);
    expect(JSON.parse(failStdout).result.status).toBe('yellow');
  });

  test('init generates a short commented config with required fields', async () => {
    const target = await mkdtemp(join(tmpdir(), 'ctg-init-'));
    try {
      await cp(`${fixture}node-pass`, target, { recursive: true });
      const exitCode = await runCli(['node', 'ctg', 'init', target], {
        stdout: () => {},
        stderr: () => {}
      });
      const config = await readFile(join(target, 'clone-to-green.yml'), 'utf8');

      expect(exitCode).toBe(0);
      expect(config).toContain('# Run commands from this directory after Clone To Green creates a fresh workspace.');
      expect(config).toContain('profile: node');
      expect(config).toContain('  build:\n    - npm run build --if-present');
      expect(config).toContain('required:\n  install: true\n  build: false\n  test: true');
    } finally {
      await rm(target, { recursive: true, force: true });
    }
  });
});
