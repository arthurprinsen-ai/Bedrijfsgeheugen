# 2026-09-19 — CI admission single-flight v1

- Obligation-ID: powerhouse-ci-admission-single-flight-v1
- Fingerprint: github|ci-admission|single-flight-runner-budget-v1
- Trigger: runner saturation during simultaneous development
- Root cause: event-type-scoped concurrency split identical PR delivery; repository-wide supervisor ran on feature pushes
- Change: trigger-independent PR single-flight for Required/BRAIN, main-only supervisor push, stale projection cancellation, regression test, skills and Engineering OS writeback
- Candidate head at writeback: 85584014d75ed6429fba1a96f5540036db5e8d16
- Terminal requirement: exact-head gates → protected merge → main/readback → learning/skill projection proof
