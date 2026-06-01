# Release Checklist

- [ ] Run `npm ci`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm pack --dry-run`.
- [ ] Run `clone-to-green demo`.
- [ ] Run `ctg run examples/node-green`.
- [ ] Run `ctg run examples/node-missing-tests --allow-no-tests`.
- [ ] Update `CHANGELOG.md`.
- [ ] Tag release.
- [ ] Publish npm package.
- [ ] Create GitHub release.
- [ ] Post launch links.
