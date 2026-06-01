import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import stripAnsi from 'strip-ansi';
import type { StepName } from './types.js';
import { redactText } from './utils/redact.js';

export async function writeStepLog(
  artifactsDir: string | undefined,
  step: StepName,
  content: string
): Promise<string | undefined> {
  if (!artifactsDir) {
    return undefined;
  }
  await mkdir(artifactsDir, { recursive: true });
  const path = join(artifactsDir, `${step}.log`);
  await writeFile(path, redactText(stripAnsi(content)), 'utf8');
  return path;
}
