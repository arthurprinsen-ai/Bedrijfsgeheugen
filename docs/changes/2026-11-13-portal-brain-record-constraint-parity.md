# P0 #4215 — original Portal source write to Brain schema parity

2026-11-13. Fingerprint `portal|businessinput|brain-record-type-kind-schema-rejected-original-four-stage-source-writes|20261113-v1`.

## Production observation
Actual PostgreSQL `public.brain_records` CHECKs list the original canonical type/kind values but omit `SourceObservation/raw_source`, `BusinessInput/SourceTruth` and `ImpactAssessment/organism_impact`. `CurrentState/current_state` is admitted. The original live `brain_append_record` simply inserts supplied values; it does not normalize them. The existing four-step source writer invokes SourceObservation first and fails closed with `RAW_SOURCE_WRITE_FAILED` when the table refuses this insert. Earlier source tests use a mock append and did not cover the live schema. This is an observed schema contract mismatch, not proof a specific customer attempted the failing write.

## Existing single-owner correction
Preserve the current authenticated Netlify writer, Supabase `brain-operating-authority`, signed user app_metadata tenant authority, Brain row PK (tenant_id, record_id), tenant idempotency, SQL append RPC, existing RLS, grants and indexes. The one new original GitOps SQL file `supabase/migrations/20261113060000_portal_brain_record_contract_parity_v1.sql` adds exactly three existing producer semantic types and kinds to both existing Brain CHECKs. Every prior value remains accepted. Validate both constraints over existing rows before committing. Do not create a second table, worker, tenant store, cron, queue or consumer.

Regression `tests/brain-portal-brain-record-constraint-parity-20261113.test.mjs` checks all four actual producer record pairs, old canonical values, intact negative fail-closed behavior and least-privilege boundary. Also preserve current `tests/portal-business-input.test.mjs` and `tests/portal-business-input-powerhouse-feed.test.mjs`. Existing `agent-data-quality` and Portal Living Interface skill now enforce this runtime DB contract, with original ONE BRAIN machine-learning record and ledger.

## Proof boundaries and release
Required/BRAIN/CodeQL + Supabase official native preview → protected merge → native GitOps production migration → actual provider `supabase_migrations.schema_migrations` and `pg_get_constraintdef` readback → provider-ledger lock reconciliation using independently applied identity. Never add an unapplied migration to the historical lock. No manual provider-apply bypass, no fabricated runtime green.

Even with matching schema, original authenticated tenant-input POST/GET, exact same-tenant ONE BRAIN consumer_processed_ack, Powerhouse/Heartbeat updated revision, authorized action, effect/holdout, next-run learning remain EVIDENCE_DUE under existing P0 #4215. Keep original executor and original #4198 commercial obligations active.
