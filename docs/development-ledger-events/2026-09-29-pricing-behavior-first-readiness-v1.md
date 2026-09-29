# 2026-09-29 — Pricing behavior-first production readback

- Fingerprint: `pricing|production-readback|behavior-first-readiness|v1`
- Failure: production browser proof timed out on the private `ready-v3` marker before any user interaction.
- Root cause: terminal truth was coupled to an implementation detail instead of the stronger observable behavior contract.
- Fix: actionable-DOM readiness followed by real lifecycle, group, billing and NL/EN round-trip assertions.
- Regression: `tests/brain-pricing-behavior-first-readiness-v1.test.mjs`.
- Truth boundary: marker absence alone may not turn proven behavior red; actual interaction failure remains fail-closed.
