# Node Fragile Example

## What This Shows

A Node project with passing tests but fragile reproducibility signals.

## Command

```sh
ctg run examples/node-fragile --no-install
```

## Expected Result

Yellow.

## Why It Is Yellow

- A real test command can pass.
- No lockfile is present.
- `.env.example` exists but no env file was provided.
- The install command is non-deterministic.

## Safer Or More Reproducible Version

Commit a lockfile, use `npm ci`, and document whether `.env.example` values are required for tests.
