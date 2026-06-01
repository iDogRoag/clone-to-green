import { access, mkdir, stat } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

export async function ensureParentDir(path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
}
