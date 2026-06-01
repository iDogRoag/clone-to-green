import { describe, expect, test } from 'vitest';
import { fileURLToPath } from 'node:url';
import { detectProject } from '../src/detect.js';

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url));

describe('detectProject', () => {
  test('detects npm projects and prefers npm ci when package-lock exists', async () => {
    const detection = await detectProject(`${fixture}node-pass`, { profile: 'auto' });

    expect(detection.profile).toBe('node');
    expect(detection.packageManager).toBe('npm');
    expect(detection.commands.install).toEqual(['npm', 'ci']);
    expect(detection.commands.build).toEqual(['npm', 'run', 'build']);
    expect(detection.commands.test).toEqual(['npm', 'test']);
  });

  test('treats the default npm placeholder as no test command', async () => {
    const detection = await detectProject(`${fixture}node-no-tests`, { profile: 'auto' });

    expect(detection.profile).toBe('node');
    expect(detection.commands.test).toBeUndefined();
  });

  test('detects python pytest projects', async () => {
    const detection = await detectProject(`${fixture}python-pytest`, { profile: 'auto' });

    expect(detection.profile).toBe('python');
    expect(detection.commands.test).toEqual(['python', '-m', 'pytest']);
  });

  test('detects go and rust projects', async () => {
    await expect(detectProject(`${fixture}go-basic`, { profile: 'auto' })).resolves.toMatchObject({
      profile: 'go',
      commands: { test: ['go', 'test', './...'] }
    });
    await expect(detectProject(`${fixture}rust-basic`, { profile: 'auto' })).resolves.toMatchObject({
      profile: 'rust',
      commands: { test: ['cargo', 'test'] }
    });
  });
});
