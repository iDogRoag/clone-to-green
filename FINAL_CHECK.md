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

## v0.1.3 default demo fix

### Commands run

- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm pack --dry-run --cache /private/tmp/ctg-npm-cache`
- `node dist/cli.js demo`
- `node dist/cli.js demo --red`
- `node dist/cli.js demo --badge`

### Commands passed

- `npm test`: 11 test files passed, 39 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm pack --dry-run --cache /private/tmp/ctg-npm-cache`: passed, 43 files, 93.0 kB packed.
- `node dist/cli.js demo`: passed, status green, score 100.
- `node dist/cli.js demo --red`: passed as the expected red demo, exit 1.
- `node dist/cli.js demo --badge`: passed, printed the green badge.

### Files changed

- `CHANGELOG.md`
- `FINAL_CHECK.md`
- `README.md`
- `docs/assets/demo-output.md`
- `docs/assets/demo-output.txt`
- `docs/assets/demo-report.html`
- `docs/assets/demo.png`
- `docs/demo-script.md`
- `docs/npm-publish-check.md`
- `docs/release-v0.1.3.md`
- `package-lock.json`
- `package.json`
- `src/cli.ts`
- `src/types.ts`
- `test/cli.test.ts`
- `test/package-policy.test.ts`
- `test/readme-launch.test.ts`

### Manual next steps

- `npm publish --cache /private/tmp/ctg-npm-cache --registry=https://registry.npmjs.org/ --access public`
- `npm view clone-to-green version --registry=https://registry.npmjs.org/`
- `npx clone-to-green@latest --version`
- `npx clone-to-green@latest demo`
- `npx clone-to-green@latest demo --red`
- `git tag v0.1.3`
- `git push origin v0.1.3`
- Create GitHub v0.1.3 release
