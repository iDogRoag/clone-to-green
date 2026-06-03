# Clone To Green v0.1.3

Default demo fix release.

## Changes

- Changed `clone-to-green demo` to use the passing bundled example by default.
- Kept the missing-tests demonstration available through `clone-to-green demo --red`.
- Updated README, demo assets, and release docs so first-run examples are green.
- Kept product scope unchanged.

## Verification

- `npm test`
- `npm run build`
- `npm run typecheck`
- `npm pack --dry-run`
- `npx clone-to-green@latest --version` after publish
- `npx clone-to-green@latest demo` after publish
- `npx clone-to-green@latest demo --red` after publish
