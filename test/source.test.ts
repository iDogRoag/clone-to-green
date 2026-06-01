import { describe, expect, test } from 'vitest';
import { resolveSource } from '../src/source.js';

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
});
