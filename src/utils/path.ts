import { isAbsolute, relative, resolve } from 'node:path';

export function resolveInside(root: string, subpath = '.'): string {
  const absolute = resolve(root, subpath);
  const relation = relative(root, absolute);
  if (relation.startsWith('..') || isAbsolute(relation)) {
    throw new Error(`Path escapes workspace: ${subpath}`);
  }
  return absolute;
}

export function commandToString(command: string[]): string {
  return command.map(quoteArg).join(' ');
}

function quoteArg(arg: string): string {
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(arg)) {
    return arg;
  }
  return JSON.stringify(arg);
}
