# Node Green Example

## What This Shows

A small Node project with a lockfile, build script, and real test command.

## Command

```sh
ctg run examples/node-green
```

## Expected Result

Green.

## Why It Is Green

- `package-lock.json` is present.
- `npm ci` is deterministic.
- `npm run build` passes.
- `npm test` runs a real test.

## Safer Or More Reproducible Version

This example is already intentionally reproducible. A real project should also document required Node versions and external services.
