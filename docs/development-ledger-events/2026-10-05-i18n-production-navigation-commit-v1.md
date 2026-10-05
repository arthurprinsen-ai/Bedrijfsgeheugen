# 2026-10-05 — i18n production navigation commit proof

- Type: RECOVERY / PRODUCTION_READBACK
- Existing fingerprint: `i18n-production-navigation-readback-20260930-v1`
- Observed production SHA: `1cc8807b7afa1f69d72287d26bcedeba92d786e3`
- Netlify deploy: `6ac3756b265f4f0008ad8f8b`
- Exact provider identity: proven
- Static pricing content: proven
- Direct English route: proven
- Failure: click-driven verifier timed out waiting for `DOMContentLoaded`.
- Correction: route proof now waits for navigation `commit`; semantic locale proof remains mandatory afterwards.
- Regression: `tests/brain-i18n-production-navigation-readback-v2.test.mjs`
- Rollback: revert the verifier/test/learning update; no application data or runtime schema is changed.
