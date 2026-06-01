# Security Model

Clone To Green creates a clean workspace. It does not create a security sandbox.

Clone To Green runs install, build, and test commands from the target repository. That means arbitrary code execution. Only run it on code you trust, or run it inside your own isolated environment.

A fresh workspace protects the source checkout from mutation; it does not protect the host machine from untrusted code.

## Guarantees

- The original repository is not mutated.
- Work happens in a temporary copy or clone.
- Full parent environment inheritance is disabled by default.
- Explicit `--env` and `--env-file` values are passed intentionally.
- Remote repositories require `--yes` before `ctg run` executes their commands.
- Clone To Green itself does not make AI calls, GitHub API calls, telemetry calls, or hidden network calls.
- Secret-looking values are redacted in logs and reports.

## Non-Guarantees

- It does not prevent target commands from using the network.
- It does not prevent target commands from reading files available to the current OS user.
- It does not isolate CPU, memory, filesystem, or process access.
- It does not audit dependency install scripts.
- It does not protect secrets by itself.

The default environment behavior reduces accidental secret leakage, but it does not make untrusted code safe.

For untrusted code, run Clone To Green inside a VM, container, or disposable CI runner.

## Future Isolation

Optional Docker or container isolation mode is a roadmap item. It is not part of v1.
