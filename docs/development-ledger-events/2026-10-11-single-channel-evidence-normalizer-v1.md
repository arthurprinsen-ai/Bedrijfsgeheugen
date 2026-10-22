# Recovery ledger: canonical channel-evidence normalizer

- Date: 2026-10-11
- Parent issue: #4198
- Cause: parallel remedies introduced two overlapping serialization triggers
- Resolution: extend the existing protected-main normalizer and drop the redundant trigger
- Source: supabase/migrations/20261011124000_consolidate_channel_evidence_normalizer_v1.sql
- Regression: tests/brain-channel-evidence-single-normalizer.test.mjs
- Safety: service-role-only executor, no provider side effects or duplicate send permission changes
- Closure: provider publication and commercial conversion remain independently unproven
