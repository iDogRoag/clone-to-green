import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

describe('launch-ready README', () => {
  test('opens with the public hook, quickstart, demo, and sample output', async () => {
    const readme = await readFile('README.md', 'utf8');
    const firstScreen = readme.slice(0, 1600);

    expect(firstScreen).toContain('Can a stranger clone your repo and get green?');
    expect(firstScreen).toContain('npx clone-to-green run .');
    expect(firstScreen).toContain('npx clone-to-green demo');
    expect(firstScreen).toContain('Reproducibility score: 15 out of 100');
    expect(firstScreen).toContain('npx clone-to-green demo --format html --output ctg-demo.html');
  });

  test('keeps launch formatting and demo links polished', async () => {
    const readme = await readFile('README.md', 'utf8');

    expect(readme.split('\n').length).toBeGreaterThan(80);
    expect(readme).toContain('```sh\nnpx clone-to-green run .\n```');
    expect(readme).toContain('```sh\nnpx clone-to-green demo\n```');
    expect(readme).toContain('```yaml\nname: Clone To Green');
    expect(readme).toContain('```sh\nnpx clone-to-green run . --format table');
    expect(readme).not.toContain('Terminal GIF coming soon.');
    expect(readme).toContain('Preview the demo output:');
    expect(readme).toContain('- Terminal output: [docs/assets/demo-output.txt](docs/assets/demo-output.txt)');
  });

  test('includes publish-readiness docs for the next manual release', async () => {
    await expect(readFile('docs/npm-publish-check.md', 'utf8')).resolves.toContain('npm publish');
    await expect(readFile('docs/release-v0.1.2.md', 'utf8')).resolves.toContain('Clone To Green v0.1.2');
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
