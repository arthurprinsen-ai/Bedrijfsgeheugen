# 2026-10-06 — CI single Netlify build parity v1

Current-state-first audit found GitHub Actions fan-out to be the dominant delivery-latency problem: 202 registered workflows and at least 2500 runs reported for 2026-10-06 at audit time.

The protected gate itself is small, but the Required workflow duplicated deterministic Netlify production build work with the website lane. The fix centralizes parity into one job, runs it after classification in parallel with selected lanes, and keeps its result inside the protected `test` aggregate.

No required truth gate is removed. Exact candidate SHA, deterministic production build parity, targeted browser verification and post-merge production readback remain separate proofs.

Regression authority:
- `tests/brain-ci-critical-path-acceleration-v1.test.mjs`
- `tests/brain-netlify-premerge-build-parity-v1.test.mjs`
