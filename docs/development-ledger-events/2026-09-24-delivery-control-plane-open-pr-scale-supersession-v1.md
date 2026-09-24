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
- Additional root cause: stale queued Actions-runs without current open-PR authority persisted for days.
- Prevention: hourly repository janitor; full open-PR pagination; `STALE_QUEUED_NO_OPEN_PR` cleanup after 6h.
- Safety: TTL cleanup applies only to queued non-main runs with no open PR; current PR heads and in-progress work remain protected.
- Regression: `tests/brain-delivery-stale-queue-janitor-v1.test.mjs`.

- Janitor workflow integrity incident: intermediate patching corrupted the workflow tail through tab-delimited shell parsing.
- Recovery: rebuilt from clean main, switched to JSON-per-run parsing, and added structural workflow regression.
- Regression: `tests/brain-delivery-janitor-workflow-integrity-v1.test.mjs`.
