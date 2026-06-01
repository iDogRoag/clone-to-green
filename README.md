# Clone To Green

Clone To Green answers one practical question:

Can a developer clone this repo from scratch and get to green without hidden local setup?

It clones or copies a repository into a temporary fresh workspace, detects the project type, infers install/build/test commands, runs them, captures logs, and produces a clear report.

## Install

```sh
npm install -g clone-to-green
```

Node.js 24 LTS is the supported runtime baseline. Use Node 24 for local development and CI.

## Quick Start

```sh
ctg run
ctg run .
ctg run owner/repo --yes
ctg run . --format markdown --output ctg-report.md
ctg run . --allow-no-tests
ctg run . --fail-on-yellow
ctg plan .
ctg init
ctg doctor
```

`clone-to-green` and `ctg` are the same CLI.

## Safety Defaults

Clone To Green creates a clean workspace. It does not create a security sandbox.

Clone To Green runs install, build, and test commands from the target repository. That means arbitrary code execution. Only run it on code you trust, or run it inside your own isolated environment.

A fresh workspace protects the source checkout from mutation; it does not protect the host machine from untrusted code.

By default Clone To Green:

- does not mutate the original repository
- copies or clones into a temporary workspace
- deletes the temporary workspace after the run
- does not pass the full parent environment to child commands
- passes only a safe allowlist plus explicit `--env` and `--env-file` values
- requires `--yes` before executing commands from remote repositories
- makes no AI calls, GitHub API calls, telemetry calls, or hidden network calls
- redacts secret-looking values in logs and reports

The default environment behavior reduces accidental secret leakage, but it does not make untrusted code safe.

Network access can still happen when the target repository's own commands install dependencies or run tests.

## Commands

### `ctg run [source]`

Run a full fresh-workspace check. The default source is the current directory.

Sources may be:

- a local path, such as `.`
- a git URL, such as `https://github.com/owner/repo.git`
- a GitHub shorthand, such as `owner/repo`, expanded deterministically to `https://github.com/owner/repo.git` without using the GitHub API

### `ctg plan [source]`

Inspect the repository and print the detected plan. It does not run install, build, or test commands.

### `ctg init [path]`

Create a starter `clone-to-green.yml` based on detected project type. It does not overwrite an existing config unless `--force` is passed.

### `ctg doctor`

Report local tool availability for git, node, npm, corepack, pnpm, yarn, bun, python, pip, uv, poetry, go, cargo, and docker.

## Common Flags

```sh
--format table|json|markdown|html
--output <file>
--config <file>
--workdir <path>
--profile auto|node|python|go|rust|docker|custom
--timeout <seconds>
--step-timeout <seconds>
--keep-workspace
--artifacts-dir <path>
--env KEY=value
--env-file <path>
--inherit-env
--no-install
--no-build
--no-test
--ci
--verbose
--quiet
--yes
--allow-no-tests
--fail-on-yellow
```

## Status And Scoring

Green means all required setup commands passed and a real test command ran successfully.

Yellow means setup commands passed, but the repository only reached a partial confidence state. For example, optional commands were skipped, no build command was detected, or no tests were detected with `--allow-no-tests`.

Red means the repository failed to reach the required state. No detected tests is red by default.

Every report includes a reproducibility score from 0 to 100 plus a confidence label:

- `90-100`: strong
- `70-89`: good
- `50-69`: fragile
- `0-49`: weak

## Exit Codes

- `0`: the repository reached green, or yellow without `--fail-on-yellow`
- `1`: the repository reached red, or yellow with `--fail-on-yellow`
- `2`: invalid CLI usage, invalid config, unreadable source, missing source, or internal error
- `3`: missing required local tool
- `4`: timeout

## Configuration

See [docs/configuration.md](docs/configuration.md).

## Report Schema

See [docs/report-schema.md](docs/report-schema.md).

## Security Model

See [docs/security-model.md](docs/security-model.md).

## Roadmap

- JUnit XML output for CI test views
- PR comment mode
- Docker or container isolation
- Monorepo package matrix
- `ctg explain` command
