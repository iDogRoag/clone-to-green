# Configured Example

## What This Shows

A repository that uses `clone-to-green.yml` to make command selection explicit.

## Command

```sh
ctg plan examples/configured
```

## Expected Result

The plan uses the configured commands.

## Why It Is Green, Yellow, Or Red

The status depends on the configured commands when run. The point of this example is explicit reproducibility configuration.

## Safer Or More Reproducible Version

Keep the config short, commit lockfiles, and document required environment variables.
