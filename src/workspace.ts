import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function createTempRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'clone-to-green-'));
}

export async function removeWorkspace(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}
