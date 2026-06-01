import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

describe('launch-ready README', () => {
  test('opens with the public hook, quickstart, demo, and sample output', async () => {
    const readme = await readFile('README.md', 'utf8');
    const firstScreen = readme.slice(0, 1600);

    expect(firstScreen).toContain('Can a stranger clone your repo and get green?');
    expect(firstScreen).toContain('npx clone-to-green run .');
    expect(firstScreen).toContain('npx clone-to-green demo');
    expect(firstScreen).toContain('Reproducibility score 61 out of 100');
    expect(firstScreen).toContain('npx clone-to-green demo --format html --output ctg-demo.html');
  });

  test('contains the requested launch sections', async () => {
    const readme = await readFile('README.md', 'utf8');
    const sections = [
      '## What is Clone To Green',
      '## Why this exists',
      '## Quickstart',
      '## Demo',
      '## Example output',
      '## What green means',
      '## Reproducibility score',
      '## Supported projects',
      '## GitHub Actions usage',
      '## Install',
      '## Configuration',
      '## Report formats',
      '## Security model',
      '## Limitations',
      '## Roadmap',
      '## Contributing',
      '## License'
    ];

    for (const section of sections) {
      expect(readme).toContain(section);
    }
  });
});
