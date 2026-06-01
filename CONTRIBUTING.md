# Contributing

Thanks for helping improve Clone To Green.

Clone To Green should stay deterministic, local-first, and honest about what it can prove. Do not add AI calls, GitHub API calls, telemetry, or hidden network calls.

## How To Install

Use Node.js 24 LTS.

```sh
npm ci
```

## How To Run Tests

```sh
npm test
npm run typecheck
npm run build
```

For package-shape checks:

```sh
npm pack --dry-run
```

## How Project Detection Works

Detection is deterministic and file-based. The detector checks the selected working directory for project markers such as `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, and `Dockerfile`.

For Node projects, lockfiles decide the package manager whenever possible.

## How To Add A New Project Detector

1. Add file-signal detection in `src/detect.ts`.
2. Return a `ProjectDetection` with profile, reasons, and command candidates.
3. Add fixtures under `test/fixtures`.
4. Add tests in `test/detect.test.ts` and `test/planner.test.ts`.
5. Update `docs/detection.md`.

## How To Add A Failure Pattern

1. Add classification logic in `src/failure-analysis.ts` or scoring logic in `src/reproducibility.ts`.
2. Keep messages actionable and non-alarmist.
3. Add a fixture or runner test that reproduces the signal.
4. Update report docs if the JSON shape changes.

## How To Add A Fixture

Fixtures should be tiny and deterministic.

- Avoid network dependencies.
- Avoid real credentials.
- Keep package manifests minimal.
- Prefer built-in tools such as `node --test`.

## How To Add A Reporter

1. Add a renderer under `src/reporters`.
2. Keep JSON stable and machine-readable.
3. Escape HTML and Markdown-sensitive content.
4. Add tests in `test/reporters.test.ts`.
5. Update README report format docs.

## How To Write A Good Failure Explanation

Good failure explanations should say:

- what failed
- why Clone To Green thinks it failed
- what the next useful action is

Avoid claiming certainty when Clone To Green only observed a symptom.

## Pull Requests

- Add or update tests for behavior changes.
- Update docs when user-visible CLI behavior changes.
- Keep failure messages actionable and avoid leaking environment values.
- Keep the scope tight.
