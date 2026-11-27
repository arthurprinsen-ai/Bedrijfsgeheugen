# Incident: recurring native migration source lock delay (835)

- Fingerprint: `supabase|migration-history|original-native-provider-835-source-lock|20261112-v1`
- Parent P0: #4198. Dependent Portal: #5674, Required failed #43290454501.
- Root cause: protected native migration #835 from merged PR #5681 applied once in production, but original Git source lock remained 834. Earlier #834 gap had likewise blocked PR #5674.
- Independent provider: project adhjwmvyoixzjtmiroln, `supabase_migrations.schema_migrations` count 835, latest `20261112211000/original_skipped_provider_reference_readback_handoff_v1`.
- Authorized bounded correction: append exact source-lock row only, preserve immutable 834 prefix and existing SQL, verify no duplicate/new scheduler; no migration replay or bypass.
- One-loop prevention: original provider writer → source-lock ACK must be PROCESSSED under same source revision/tenant/owner/idempotency and be independently read before unrelated protected admission. Missing ACK remains RED.
- Machine regression: `tests/brain-original-provider-835-native-source-lock-20261112.test.mjs`. Learning: `brain/learning/2026-11-12-native-provider-835-source-lock-handoff-v1.json`.
- Terminal remains OPEN until protected Required+CodeQL+main + native provider exact identity readback and named Portal/Brain/Heartbeat consumer proof. No claimed customer action, provider send or commercial outcome.
