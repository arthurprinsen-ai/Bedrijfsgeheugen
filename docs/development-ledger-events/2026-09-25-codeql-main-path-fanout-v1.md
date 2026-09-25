# Development ledger — CodeQL main path scope v1

- Date: 2026-09-25
- Failure class: unnecessary GitHub Actions main-push fan-out
- Root cause: generic CodeQL main trigger lacked the Python path scope already present on pull requests
- Fix: scope main pushes to `**/*.py` and `.github/workflows/codeql.yml`
- Regression: `tests/brain-ci-admission-single-flight.test.mjs`
- Fingerprint: `github|codeql-main-push|path-scope-python|v1`
