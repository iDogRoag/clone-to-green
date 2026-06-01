import { readFile } from 'node:fs/promises';

const SAFE_PARENT_ENV_KEYS = ['PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot', 'COMSPEC', 'PATHEXT'];

export function buildChildEnv(options: {
  inheritEnv: boolean;
  envFile?: Record<string, string>;
  explicitEnv?: Record<string, string>;
}): Record<string, string> {
  const base = options.inheritEnv ? filterUndefined(process.env) : minimalEnv();
  return {
    ...base,
    CI: 'true',
    ...options.envFile,
    ...options.explicitEnv
  };
}

export async function loadEnvFile(path: string): Promise<Record<string, string>> {
  const raw = await readFile(path, 'utf8');
  const parsed: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const normalized = trimmed.startsWith('export ') ? trimmed.slice('export '.length).trim() : trimmed;
    const equalIndex = normalized.indexOf('=');
    if (equalIndex <= 0) {
      continue;
    }
    const key = normalized.slice(0, equalIndex).trim();
    const value = normalized.slice(equalIndex + 1).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }
    parsed[key] = unquoteEnvValue(value);
  }

  return parsed;
}

export function parseEnvAssignments(values: string[] = []): Record<string, string> {
  const env: Record<string, string> = {};
  for (const value of values) {
    const equalIndex = value.indexOf('=');
    if (equalIndex <= 0) {
      throw new Error(`Invalid --env value "${value}". Use KEY=value.`);
    }
    const key = value.slice(0, equalIndex);
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new Error(`Invalid --env key "${key}".`);
    }
    env[key] = value.slice(equalIndex + 1);
  }
  return env;
}

function minimalEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const key of SAFE_PARENT_ENV_KEYS) {
    const value = process.env[key];
    if (value !== undefined) {
      env[key] = value;
    }
  }
  return env;
}

function filterUndefined(input: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(Object.entries(input).filter((entry): entry is [string, string] => entry[1] !== undefined));
}

function unquoteEnvValue(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
