# Detection

Detection is deterministic and file-based.

## Node

Signals:

- `package.json`
- lockfiles

Package manager precedence:

1. `package-lock.json` or `npm-shrinkwrap.json`: `npm`
2. `pnpm-lock.yaml`: `pnpm`
3. `yarn.lock`: `yarn`
4. `bun.lock` or `bun.lockb`: `bun`

Install commands:

- npm with lockfile: `npm ci`
- npm without lockfile: `npm install`
- pnpm: `pnpm install --frozen-lockfile`
- yarn: `yarn install --frozen-lockfile`
- bun: `bun install --frozen-lockfile`

Build and test commands are inferred from `scripts.build` and `scripts.test`. The default npm placeholder test is treated as no test.

No detected test command is red by default. Use `--allow-no-tests` to make that state yellow instead.

## Python

Signals:

- `pyproject.toml`
- `requirements.txt`
- pytest config or `tests/`

## Go

Signal: `go.mod`

## Rust

Signal: `Cargo.toml`

## Docker

Signal: `Dockerfile`

Auto-detection checks only the selected working directory. Use `--workdir` or config for monorepos.
