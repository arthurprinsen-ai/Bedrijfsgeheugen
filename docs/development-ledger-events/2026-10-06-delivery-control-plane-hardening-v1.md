# Development ledger event — delivery control-plane hardening v1

- Date: 2026-10-06
- Obligation: `delivery-control-plane-hardening-20261006-v1`
- Lane: automation
- Observed waste: critical jobs used `fetch-depth: 0`; full remote ref fetches included hundreds of stale branches.
- Observed blocking: writer verification allowed 72 polling attempts × 5 seconds.
- Decision: shallow exact-state fetches, 30-second synchronous external budget, single bounded delivery supervisor.
- Missing-gate recovery: redispatch only when an open PR exact HEAD has zero Required runs after the grace period.
- PR cleanup: explicit retired/superseded state only; never age-only deletion.
- Safety: exact-head identity, protected merge, security and provider truth remain mandatory.
- Regression: `tests/brain-delivery-control-plane-hardening-v1.test.mjs`.
