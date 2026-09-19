# 2026-09-19 — CI path-scope efficiency v1

- Obligation-ID: github-ci-path-scope-efficiency-v1
- Fingerprint: github|ci-path-scope|semantic-admission-v1
- Failure class: GITHUB_DELIVERY
- Trigger: avoidable GitHub Actions fan-out after runner single-flight was fixed
- Root cause: broad auxiliary workflow path admission plus duplicate Revenue Learning path entries
- Prevention: semantic path filters, explicit runtime dependency wiring, no duplicate path entries, bounded runtime, PR/ref single-flight
- Regression: tests/brain-ci-admission-single-flight.test.mjs
- Skill projection: powerhouse-delivery-self-optimization
- Terminal requirement: exact-head gates -> protected merge -> current-main production/readback evidence
