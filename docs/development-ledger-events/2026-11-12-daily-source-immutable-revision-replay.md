# Original BRAIN source handoff P0001 event and remediation

- UTC: 2026-11-12; native original production project adhjwmvyoixzjtmiroln; original issue #4198
- Observed failure: `select public.powerhouse_daily_source_archive_v1('2026-11-11'::date)` returned P0001 OBLIGATION_IDENTITY_IMMUTABLE; original guardian `public.brain_guard_obligation_identity` verified intact.
- Root cause: source manifest changes after new post source ingestion, old SQL erroneously performs `ON CONFLICT DO UPDATE payload_sha256` despite immutable BRAIN obligation identity. Existing original record stays OPEN and original failed transaction rolled back.
- Fix: supabase/migrations/20261112190000_original_daily_source_immutable_obligation_ack_v1.sql retaining payload SHA and identity, updates only current source revision/ACK, independently verifies exact source revision in original #140.
- Owner: original single #175/#140/Heartbeat; no new scheduler, token, publishing or provider side effect; do not disable guard.
- Tests: tests/brain-original-daily-source-immutable-revision-20261112.test.mjs, protected Required/CodeQL/Supabase Preview, native provider/source lock parity, real original Nov 11/12 archive and consumer ACK.
- Learning: brain/learning/2026-11-12-daily-source-immutable-revision-replay-v1.json; maturity FIX_CANDIDATE, no false production execution/experiment outcome.
