# Node Missing Tests Example

## What This Shows

A Node project that can install but has no real test command.

## Command

```sh
ctg run examples/node-missing-tests
ctg run examples/node-missing-tests --allow-no-tests
```

## Expected Result

Red by default. Yellow with `--allow-no-tests`.

## Why It Is Red Or Yellow

- No real test command is detected.
- No lockfile is present.
- The package manager is guessed.

## Safer Or More Reproducible Version

Add a real test script and commit a lockfile.
