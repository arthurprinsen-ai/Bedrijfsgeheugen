# 2026-10-06 — Delivery/publisher parity recovery

Material delivery repair for the canonical publication lane.

- Production publisher source was brought back into repository parity.
- Social audit/cockpit work is separated from the normal publish path through `publish_only`.
- Legacy JSONB evidence is normalized before object merge/spread.
- The applied production SQL snapshot is retained under `docs/production-sql-history/` instead of entering the forward migration lane.
- LinkedIn company stays fail-closed at the real external boundary: no active connected account currently proves the required organization-admin scope.
- No provider publication ID or success proof was fabricated.

Evidence is bound to PR #3846 and its exact HEAD checks.
