# 2026-09-24 — System Map browser-skill registration

- Fingerprint: `system-map-browser-skill-registration-v1`
- Trigger: post-merge backend topology regression after PR #2834.
- Root cause: a new material skill was added without same-lineage System Map inventory writeback.
- Fix: register `powerhouse-browser-gate-boundedness`, update provider skill count to 10, and harden the skill contract.
- Regression: `tests/brain-powerhouse-live-system-map-v1.test.mjs`.
- Status: `IMPLEMENTED_CANDIDATE` pending protected merge and production/readback where applicable.
