# Development ledger · contextuele voorspellingen · 2026-10-14

- Change: reusable forecast chart and sensitivity controls integrated with existing portal pages.
- Canonical state read only: `state.forecasts` or `state.predictions`; no extra cron, database writer or prediction claims.
- Source provenance, model, last update and uncertainty optional; absent data triggers explicit unavailable state.
- Evidence: GitHub PR #4369, CodeQL and protected CI still mandatory; real tenant validation pending.
- Related test: `tests/portal-contextual-forecast.test.mjs`.
