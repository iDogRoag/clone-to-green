import { readFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { PROFILES, type CloneToGreenConfig } from './types.js';
import { pathExists } from './utils/fs.js';

export const DEFAULT_CONFIG_FILES = [
  'clone-to-green.yml',
  'clone-to-green.yaml',
  '.clone-to-green.yml',
  '.clone-to-green.yaml'
];

const commandSchema = z
  .union([z.string().min(1), z.array(z.string().min(1)).min(1)])
  .transform((value) => {
    if (typeof value === 'string') {
      return parseCommand(value);
    }
    if (value.length === 1 && /\s/.test(value[0]!)) {
      return parseCommand(value[0]!);
    }
    return value;
  });

const rawConfigSchema = z
  .object({
    version: z.literal(1).optional(),
    profile: z.enum(PROFILES).optional(),
    workdir: z.string().min(1).optional(),
    commands: z
      .object({
        install: commandSchema.optional(),
        build: commandSchema.optional(),
        test: commandSchema.optional()
      })
      .strict()
      .optional(),
    env: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
    skip: z
      .object({
        install: z.boolean().optional(),
        build: z.boolean().optional(),
        test: z.boolean().optional()
      })
      .strict()
      .optional(),
    required: z
      .object({
        install: z.boolean().optional(),
        build: z.boolean().optional(),
        test: z.boolean().optional()
      })
      .strict()
      .optional()
  })
  .strict();

export async function findConfigFile(root: string): Promise<string | undefined> {
  for (const file of DEFAULT_CONFIG_FILES) {
    const candidate = join(root, file);
    if (await pathExists(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

export async function loadConfigForRoot(root: string, configPath?: string): Promise<{
  path?: string;
  config: CloneToGreenConfig;
}> {
  const found = configPath ? resolveConfigPath(root, configPath) : await findConfigFile(root);
  if (!found) {
    return { config: {} };
  }
  return { path: found, config: await loadConfigFile(found) };
}

export async function loadConfigFile(path: string): Promise<CloneToGreenConfig> {
  let raw: unknown;
  try {
    raw = parse(await readFile(path, 'utf8')) ?? {};
  } catch (error) {
    throw new Error(`Invalid config in ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const parsed = rawConfigSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid config in ${path}: ${parsed.error.issues.map((issue) => issue.message).join(', ')}`);
  }

  return {
    ...parsed.data,
    env: normalizeEnv(parsed.data.env)
  };
}

export function parseCommand(input: string): string[] {
  const args: string[] = [];
  let current = '';
  let quote: '"' | "'" | undefined;
  let escaping = false;

  for (const char of input.trim()) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === '\\' && quote !== "'") {
      escaping = true;
      continue;
    }

    if ((char === '"' || char === "'") && !quote) {
      quote = char;
      continue;
    }

    if (char === quote) {
      quote = undefined;
      continue;
    }

    if (/\s/.test(char) && !quote) {
      if (current) {
        args.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (quote) {
    throw new Error(`Unclosed quote in command: ${input}`);
  }
  if (escaping) {
    current += '\\';
  }
  if (current) {
    args.push(current);
  }

  return args;
}

function resolveConfigPath(root: string, configPath: string): string {
  return isAbsolute(configPath) ? configPath : resolve(root, configPath);
}

function normalizeEnv(input?: Record<string, string | number | boolean>): Record<string, string> | undefined {
  if (!input) {
    return undefined;
  }
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, String(value)]));
}
