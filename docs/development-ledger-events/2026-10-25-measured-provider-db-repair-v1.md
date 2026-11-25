# Daily growth source-adapter readback repair — 2026-10-25

- Root cause: declared measured social reads were missing from the existing content orchestrator's explicit DirectQuery table allowlist; the freshness .gte method was not implemented. Provider function log exact fingerprint: DB_TABLE_REJECTED:social_posts at 2026-10-24 22:25:13.089 UTC.
- Impact: COMPANY_PROVIDER_EVIDENCE_READ_FAILED, source-unavailable measured-next-post and no bounded exploration for company channel despite actual provider-linked post snapshots.
- Fix: owned-brand only, two read-only social tables, parameterized observed_at UTC floor, provider JSON normalization and block source writes.
- Single owner: existing powerhouse-content-orchestrator, no new cron, agent or database; exact-source evidence remains required for future claims.
- Regressions: tests/brain-measured-provider-db-source-allowlist-v1.test.mjs and tests/brain-measured-next-post-challenger-v1.test.mjs.
- Evidence and status: candidate only. Required/CodeQL, protected merge, new Edge deploy and genuine next producer evaluation must succeed before closure.


## 28 October recurrence — personal history query
The production orchestrator failed at `load-context` with `DB_MEASUREMENT_GTE_SCOPE_REJECTED` (2026-10-28T08:09:40.211Z). The story-family query used the measurement-only `gte` method on a publication date, followed by unsupported `lt`. Both LinkedIn obligations remained PLANNED without provider IDs.

The same recovery lineage replaces the range with seven explicit previous calendar dates using the existing bound `IN` filter. Tenant, personal channel, published statuses, measurement read-only scope, historical uniqueness and publisher authority stay enforced. Three real-adapter regression cases reproduce the exact failure before the fix and pass after it (DST week, year boundary, leap day); relevant suite 20/20. Protected CI, merge, Supabase source parity and real next-run publication proof remain pending; this is not a live-publication claim.

Candidate correction: both founder-reserve and load-context history callers now use IN. Six real-adapter replay cases and relevant23/23 pass. Independent review rejected first remote candidate207ae8c because first-match serialization differed from locally tested bytes; PR was made draft before merge. Exact remote/local blob parity is required before ready.
