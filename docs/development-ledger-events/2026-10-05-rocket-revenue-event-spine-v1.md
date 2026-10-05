# 2026-10-05 — Rocket revenue event spine

- Type: IMPROVEMENT / REVENUE_INTELLIGENCE
- Fingerprint: `powerhouse|rocket-revenue-event-spine|v1`
- Signal: the Rocket Internet growth model was applicable to Bedrijfsgeheugen but had to be integrated into the existing Powerhouse Brain instead of copied as a separate subsystem.
- Existing state: `growth_events`, sales actions/outcomes, opportunities, experiments, revenue attribution, predictive signals, NBA v5 and commercial learning already existed.
- Gap: no single explicit identity + intent + multi-touch + orchestration contract connected these layers end to end.
- Fix: added canonical event taxonomy, hashed identity/company graph, continuous intent score, position-based attribution snapshot, NBA contract, health view and non-blocking revenue spine cycle.
- Failure found during implementation: synchronous invocation of every heavyweight revenue engine caused timeout and runtime-event lock contention.
- Structural prevention: heavy existing engines retain independent idempotent schedulers; the spine shares lineage and refreshes bounded state instead of double-running those engines.
- Security: new state tables use RLS, service-role-only grants/policies and deterministic function search paths; internal views use security-invoker and browser-role revocation.
- Production evidence: 23,784 entities; 47,725 identifiers; 33 attribution touches; 422 NBA rows; attribution balanced; runtime state `actioned`; data quality `VERIFIED`; confidence 1.
- Regression: `tests/supabase-powerhouse-rocket-revenue-event-spine-v1.test.mjs`.
- Revenue truth boundary: attribution is observed allocation, not causal proof.
- Rollback: revert migration/function lineage and restore Revenue Intelligence edge function v1.3 contract; existing canonical stores remain intact because no parallel CRM/store was created.

