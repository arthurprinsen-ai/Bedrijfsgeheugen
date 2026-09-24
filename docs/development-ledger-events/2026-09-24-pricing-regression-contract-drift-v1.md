# 2026-09-24 — Pricing regression contract drift

- Fingerprint: `pricing-regression-contract-drift-20260924-v1`
- Trigger: backend lane in PR #2834 exposed two mutually contradictory stale pricing tests after #2832.
- Root cause: historical tests were not co-migrated when locator geometry was replaced by direct DOM geometry.
- Fix: align stale tests with the already-canonical verifier and its new regression.
- Safety preserved: real pointer, no `force:true`, no DOM `.click()`, fail-closed visibility/geometry.
- Status: `IMPLEMENTED_CANDIDATE` pending protected gates, merge and production readback.
