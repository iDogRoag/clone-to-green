# Clone To Green Launch Checklist

- [x] Create GitHub repo.
- [x] Replace placeholder repo URLs.
- [ ] Publish npm package.
- [ ] Add repo topics.
- [ ] Record terminal demo GIF or screenshot.
- [ ] Post Show HN.
- [ ] Post to focused Reddit communities.
- [ ] Post to X, LinkedIn, Bluesky, and relevant Discords.
- [ ] Submit to developer launch sites.
- [ ] Ask maintainers to test their own repos and share reports.

## Pre-Launch Verification

```sh
npm ci
npm test
npm run build
npm run typecheck
npm pack --dry-run
npx clone-to-green demo
```
