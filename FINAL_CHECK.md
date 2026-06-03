# Final Check

## v0.1.2 polish

### Commands run

- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm pack --dry-run --cache /private/tmp/ctg-npm-cache`

### Commands passed

- `npm test`: 11 test files passed, 37 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm pack --dry-run --cache /private/tmp/ctg-npm-cache`: passed, 39 files, 52.8 kB packed.

### Files changed

- `README.md`
- `FINAL_CHECK.md`
- `package.json`
- `test/package-policy.test.ts`
- `test/readme-launch.test.ts`

### Manual next steps

- `npm version patch`
- `npm publish`
- `git push --follow-tags`
- Create GitHub v0.1.2 release

## v0.1.2 publish readiness

### Commands run

- `npm test`
- `npm run build`
- `npm run typecheck`
- `npm pack --dry-run --cache /private/tmp/ctg-npm-cache`
- `npm view clone-to-green version --registry=https://registry.npmjs.org/`

### Commands passed

- `npm test`: 11 test files passed, 38 tests passed.
- `npm run build`: passed.
- `npm run typecheck`: passed.
- `npm pack --dry-run --cache /private/tmp/ctg-npm-cache`: passed, 42 files, 113.4 kB packed.
- `npm view clone-to-green version --registry=https://registry.npmjs.org/`: returned `0.1.1`.

### Files changed

- `CHANGELOG.md`
- `FINAL_CHECK.md`
- `docs/npm-publish-check.md`
- `docs/release-v0.1.2.md`
- `src/types.ts`
- `test/package-policy.test.ts`
- `test/readme-launch.test.ts`

### Manual next steps

- `npm publish`
- `npm view clone-to-green version`
- `npx clone-to-green@latest --version`
- `npx clone-to-green@latest demo`
- `git tag v0.1.2`
- `git push origin v0.1.2`
- Create GitHub v0.1.2 release
- Add repo topics if not already added
