# 2026-10-08 · Commercial daily action proof / Brain obligation

- **Obligation:** `commercial-day-provider-proof-brain-20261008-v1`
- **Authority:** existing `powerhouse_commercial_heartbeat_v1`, Growth & Revenue OS, canonical channel publishers and Brain obligations.
- **Observed failure:** Heartbeat labelled a day as `actioned` when its output assurance counted zero Gmail and zero social provider-proven actions. One failed LinkedIn reply had a valid OBSERVE/non-send decision. Safety success and commercial delivery were conflated.
- **Change:** extend the existing output assurance to require exact email message/thread or social object/provider proof; include canonical `LIVE_PROVEN` blog/social publication readback; upsert one existing-Brain `COMMERCIAL_EXECUTION` daily obligation; emit `observed` when no provider action is proved.
- **Risk:** R4 / production SQL function replacement; no new scheduler, queue or external provider mutation; SQL reads existing sales/publication records and writes existing Brain obligation/health/outcome evidence.
- **Verification:** pre-merge `tests/brain-commercial-day-provider-proof-v1.test.mjs` historical replay and canary, Required/backend, CodeQL and Supabase preview; after merge, Supabase migration ledger, live Heartbeat event and matching Brain obligation readback.
- **Current state:** protected PR candidate; not live/proven until all gates and production readback pass.

## Isolated Supabase runtime validation (2026-10-08 07:47 UTC)
- Cost-authorized dedicated preview project `fvbaioyvexqjvxfzqewj` was created for the exact Git branch; Supabase reports `ACTIVE_HEALTHY`.
- The complete SQL migration was executed in a single **BEGIN → CREATE OR REPLACE functions → SELECT output assurance → ROLLBACK** transaction. No production DDL/data was changed and the isolated preview was not permanently changed by this dry-run.
- The runtime returned `contract=powerhouse-commercial-output-assurance-v3`, `commercial_day_proven=false`, `commercial_day_state=OPEN_NO_PROVEN_ACTION`, `provider_proof=[]`, `provider_proven_email=0`, `provider_proven_social=0`, `provider_proven_publications=0`, `healthy=false` for the empty preview business date. This confirms the fail-closed zero-output branch compiles and executes on Postgres.
- Caveat: the **Supabase GitHub provider check** on PR #4114 HEAD `8c21a239d5db3697e84919db5299c12836a36395` was still `skipped` because the Git branch was not associated with a provider-managed preview, despite the manually created isolated database of the same name. A successful dry-run is not a replacement for the required provider-owned preview status. Keep protected delivery OPEN until the association and exact-HEAD check are verified.
