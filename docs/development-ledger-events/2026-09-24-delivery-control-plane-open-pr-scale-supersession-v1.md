# 2026-09-24 — Delivery control-plane scale & supersession

- Fingerprint: `delivery-control-plane-open-pr-scale-supersession-v1`
- Trigger: high open-PR volume caused admission failure before candidate evaluation.
- Root cause: single-page open-PR discovery plus insufficient synchronous GitHub CLI output buffer.
- Fix: full pagination via `--paginate --slurp`, 64 MiB bounded buffer, supersession regression.
- Governance: `SUPERSEDED` is lineage state, never `LIVE_BEWEZEN`.
- Regression: `tests/brain-delivery-control-plane-scale-supersession-v1.test.mjs`
- Workflow: `.github/workflows/powerhouse-delivery-hygiene.yml`
- Canonical successor: PR #2796.
- Terminal status: pending protected merge and production/main readback.
