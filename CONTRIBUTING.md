# Contributing

Thanks for helping improve Clone To Green.

## Development

```sh
npm install
npm test
npm run typecheck
npm run build
```

Keep behavior deterministic. Do not add AI calls, GitHub API calls, telemetry, or hidden network calls.

## Pull Requests

- Add or update tests for behavior changes.
- Update docs when user-visible CLI behavior changes.
- Keep failure messages actionable and avoid leaking environment values.
