# Share Copy

## Show HN Title

Show HN: Clone To Green, a clean clone reproducibility checker for repos

## Show HN Post Body

I built Clone To Green because many repos look healthy until a new person tries to clone them.

It creates a clean workspace, detects install and test commands, runs them, and reports whether the repo reached green. It also flags missing tests, missing lockfiles, env assumptions, and fragile setup.

It is not a sandbox and not a CI replacement. It is a clean clone smoke test.

## Reddit Post

I made Clone To Green, a small OSS CLI that checks whether a repo can go from fresh clone to passing tests without hidden local setup.

It creates a clean workspace, detects install/build/test commands, runs them, and reports green/yellow/red plus reproducibility risks like missing tests, missing lockfiles, and env assumptions.

It is not a sandbox or CI replacement. It is meant as a clean clone smoke test for OSS repos, starter templates, hiring take-homes, and internal platforms.

## X Post

Can a stranger clone your repo and get green?

Clone To Green is an OSS CLI that runs a clean clone smoke test and reports missing tests, missing lockfiles, env assumptions, and reproducibility risks.

`npx clone-to-green run .`

## LinkedIn Post

I built Clone To Green to answer a practical repo health question: can someone clone this project from scratch and get to passing tests without hidden local setup?

It creates a clean workspace, detects install/build/test commands, runs them, and reports whether the repo reached green. It also explains fragile setup, missing tests, missing lockfiles, and env assumptions.

It is not a sandbox and not a CI replacement. It is a deterministic reproducibility checker and clean clone smoke test.

## GitHub Release Notes

Clone To Green v0.1.0 is the first public release.

- Clean workspace repo checks
- Deterministic project detection
- Green/yellow/red status reports
- Reproducibility scoring
- Table, JSON, Markdown, and HTML output
- Bundled demos and examples

## npm Package Description

Check whether a repo can go from fresh clone to passing tests with no hidden local setup.
