# 2026-11-12 source-lock incident — original native provider 832

- Fingerprint: `supabase|migration-history|applied-provider-832-revision-omitted-from-main-lock|20261112-v1`.
- Root cause: provider-applied original `20261112184500` present in executable migration SQL on main, but absent in protected source lock (831 vs 832).
- Evidence: original Supabase 832 versions, latest 20261112184500 / original_daily_post_publication_metric_ack_v1; original SQL blob `65d17b46f20448d1c41add348df8d5b723861994`; SEO PR #5659 preflight rejected parity.
- Owner: existing Supabase migration history writer. Fix: exact 1-row source-only append, no SQL replay. Protected source lock 832/832 after merge and independent provider readback required. Pending until verification.
- Prevention and regression: each applied provider migration must be source-lock attached in same canonical lineage before next unrelated protected PR; run `tests/brain-cro-production-migration-lock-20261029.test.mjs`, `tests/brain-original-supabase-800-provider-migration-lock-20261104.test.mjs`. No second scheduler/executor.
