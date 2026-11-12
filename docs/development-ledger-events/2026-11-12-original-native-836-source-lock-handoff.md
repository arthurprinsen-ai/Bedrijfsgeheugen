# Recurring original provider migration handoff gap — 836

- Date: 2026-11-12.
- Fingerprint/obligation: `supabase|migration-history|native-provider-836-source-ack|20261112-v1`.
- Parent/owner: #4198, original Supabase GitHub Integration/native migration-history writer → original ONE BRAIN source-lock consumer.
- Error: genuine native Supabase application #836 has exact `20261112211600/original_seo_opportunity_source_registry_v1`; GitHub protected main source lock remained 835.
- Effect: protected downstream release blocked on source-parity drift despite code passing individual tests.
- Recovery: append exact native identity in one protected source-lock PR, all earlier 835 identities unchanged, preserve nonempty SQL and grants, no new migration or replay, historical/shadow/canary regression.
- Permanent prevention: same original owner and immutable correlation, version/name/observed_at/source SQL SHA handoff, PROCESSED/consumer readback required before next release; not just RECEIVED. Diagnose and retry existing owner on source mismatch. Never mark a provider source green on a fabricated lock.
- Evidence: production SQL readback; merged PR #5685; exact source file in main; test `tests/brain-original-provider-836-native-source-lock-20261112.test.mjs`.
- Closure criteria: protected main merge, CI and independent 836/836 provider match; dependent portal/Trust/Brain/Heartbeat still separate and must be independently confirmed.
