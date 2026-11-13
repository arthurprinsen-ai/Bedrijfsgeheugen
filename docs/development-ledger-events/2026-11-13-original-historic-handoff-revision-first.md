# P0 #4198 — original historic content handoff BRAIN receipt starvation
- SOURCE: real Supabase public.powerhouse_content_handoff_receipts_v1 and public.content_publication_obligations; exact original #171 scheduler, no parallel executor.
- BEFORE: 21 corrected no-publish source rows, 13 BRAIN source revisions current and 8 stale after natural original cron; all 21 BRAIN OPEN as intended. Original historic CTE: 127 eligible, 8 mismatches rank 52..114, beyond original limit 48. No claim of actual repost.
- ROOT: original historic ORDER BY prioritized unchanged older OPEN consumer updated_at, not changed source/ACK revision.
- CHANGE: original provider function exact unchanged except one revision-first historical ORDER BY, same LIMIT 48, original original owner, grants and no-publish safety.
- VERIFICATION REQUIRED: protected Required/BRAIN/CodeQL + native Supabase preview; actual applied version/name + original exact source function, original cron #171 consumer ACK on 21/21 latest revisions (no terminal without source proof), protected source lock parity after real readback. All unrelated OPEN debts stay open.
- TEST: tests/brain-original-historic-handoff-revision-first-20261113.test.mjs
- LEARNING: brain/learning/2026-11-13-original-historic-handoff-revision-first-v1.json
