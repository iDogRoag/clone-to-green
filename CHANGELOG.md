# Changelog

## 0.1.3

- Changed the default bundled demo to use the passing example so `clone-to-green demo` exits green by default.
- Kept the missing-tests demonstration available through `clone-to-green demo --red`.
- Refreshed demo docs and launch copy to match the new default.

## 0.1.2

- Improved README launch polish and demo-output links.
- Improved npm package description and keywords for discoverability.
- Added npm publish readiness docs and v0.1.2 release-note draft.

## 0.1.1

- Fixed npm-installed CLI execution when npm invokes the binary through a `.bin` symlink.
- Fixed bundled demo copying after npm installation, where package paths include `node_modules`.

## 0.1.0

- Initial public version.
- Added deterministic project detection for Node, Python, Go, Rust, and Docker.
- Added clean-workspace `run`, read-only `plan`, config `init`, bundled `demo`, and local prerequisite `doctor` commands.
- Added table, JSON, Markdown, and HTML reporters.
- Added green/yellow/red status, reproducibility scoring, and launch-ready examples.
- Added launch docs, share copy, release checklist, and good first issue seeds.
- Fixed local path resolution for `owner/repo`-shaped directories and refreshed demo assets.
