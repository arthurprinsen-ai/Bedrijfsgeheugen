# 2026-10-19 — Production visual runner compatibility

- Obligation: `production-visual-browser-runtime-compat-20261019`
- Failure fingerprint: `ci|production-visual|playwright155|ubuntu2604-unsupported|v1`
- Provider evidence: [Canonical brand shell live readback #39294416171](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39294416171)
- Observed prior success: exact production SHA shell + SEO order + growth endpoint check passed. This is not browser acceptance.
- Real root cause: `ubuntu-latest` resolved to Ubuntu 26.04; Playwright 1.55 rejects Chromium installation on `ubuntu26.04-x64`. All three attempts were the same unsupported-OS error, not transient network failures.
- Scoped repair: pin only the existing `production-readback` workflow job to `ubuntu-24.04`; preserve both real browser visual tests and fail-closed result. Do not downgrade site security or skip checks.
- Automatic regression: `tests/brain-production-browser-runner-compat-20261019.test.mjs` proves explicit runner version and presence of real visual steps.
- Readback acceptance: Required CI, CodeQL, protected merge and a genuine *post-merge* complete live UI visual test; status remains pending until actually observed.
- Learning: runtime compatibility is a versioned dependency, not an implicit property of `ubuntu-latest`; re-run browser proof if runner platform changes. Do not retry known unsupported platforms three times.
