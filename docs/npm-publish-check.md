# npm Publish Check

Use this checklist for the manual `clone-to-green` npm publish. Publishing must be done manually by the maintainer.

If `npm view clone-to-green version` already returns `0.1.3`, do not republish.

If npm latest is `0.1.2`, publish `0.1.3`.

If the local npm registry is not npmjs, append `--registry=https://registry.npmjs.org/` to npm registry commands.

## Commands

```sh
npm whoami
npm view clone-to-green version
npm pack --dry-run
npm publish --dry-run
npm publish
npm view clone-to-green version
npx clone-to-green@latest --version
npx clone-to-green@latest demo
npx clone-to-green@latest demo --green --format json
npx clone-to-green@latest run examples/node-green --ci
```

## Expected Flow

1. Confirm the logged-in npm account with `npm whoami`.
2. Check the current published version with `npm view clone-to-green version`.
3. If the current version is already `0.1.3`, stop.
4. If the current version is `0.1.2`, run `npm pack --dry-run`.
5. Run `npm publish --dry-run`.
6. Run `npm publish`.
7. Verify npm latest with `npm view clone-to-green version`.
8. Verify installed CLI execution with the `npx` smoke commands.
