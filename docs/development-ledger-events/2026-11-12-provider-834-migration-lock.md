# Original Supabase source-lock 834th provider identity — append-only activity
- UTC evidence: 2026-11-12T19:05:30.734Z; canonical owner: original Supabase migration history writer / ONE BRAIN release owner.
- Root cause: production applied migration 20261112203000, while GitHub source lock still had 833 entries; dependent original PR #5674 preflight correctly failed six assertions.
- Evidence: native Supabase `list_migrations` = 834; read-only `supabase_migrations.schema_migrations` count = 834; final provider name `original_seo_keyword_tenant_alignment_v1`; existing Git SQL `supabase/migrations/20261112203000_original_seo_keyword_tenant_alignment_v1.sql` read back.
- Repair: preserve original 833 exact source rows, append only provider-verified #834, update capture timestamp. No DDL rerun, new writer, scheduler, fabricated green or BRAIN consumer ACK.
- Negative gate: source/provider mismatch remains RED if provider or future main changes independently; protected CI and exact-main+production readback are required after merge.
- Regression: `tests/supabase-migration-history-integrity.test.mjs`, `tests/brain-cro-production-migration-lock-20261029.test.mjs`, `tests/brain-original-supabase-800-provider-migration-lock-20261104.test.mjs`.
- Status: FIX_CANDIDATE; post-merge 834/834 parity and original Portal #5674 release not yet proven.
