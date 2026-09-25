# 2026-09-24 — Pricing inline readiness authority

- Fingerprint: `pricing-inline-readiness-authority-v1`
- Production failure: run `36061517298`, job `107841420092`.
- Exact observed failure: `page.waitForFunction` timed out after 20 seconds before pricing interaction proof.
- Root cause: primary pricing interactions and readiness marker had different authorities.
- Fix: primary inline pricing runtime emits `ready-v3` and its initial state after initialization.
- Rescue JS remains additive only.
- Regression: `tests/brain-pricing-inline-readiness-authority-v1.test.mjs`.
- Status: `IMPLEMENTED_CANDIDATE` pending protected merge and production readback.
