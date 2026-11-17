# Append-only release reliability event — 17 Nov 2026

- Owner: existing original Supabase protected migration history authority / GitHub Required. No second source of truth or migration executor.
- Observed: protected PR #5942 failed historical SQL migration inventory assertions. Original database applied records **876**, checked exact full set, original GitHub source lock **875**, all existing 875 identities matched. The sole new provider identity is `20261117094500_original_result_guardian_existing_watchdog_v1`. Original SQL is already tracked and provider-applied.
- Root cause: publication/engineering migration lock snapshot did not advance after original guardian migration deployment.
- Repair: append exactly provider-readback identity to `supabase/migration-history.lock.json` without modifying executable SQL, preserving original applied history. `captured_at` equals actual provider readback. Provenance: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44053428555 and canonical Supabase schema_migrations provider.
- Regression: tests/supabase-migration-history-integrity.test.mjs, tests/brain-cro-production-migration-lock-20261029.test.mjs, tests/brain-original-supabase-800-provider-migration-lock-20261104.test.mjs. Learning: brain/learning/2026-11-17-provider-migration-lock-875-876-reconcile.json.
- Acceptance: protected all Required historical migration tests and both CodeQL succeed, merge main; re-run original #5942 check. No user conversion, Instagram post or commercial email provider result claimed by this lock.
