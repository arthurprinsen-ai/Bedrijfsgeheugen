# Daily growth source-adapter readback repair — 2026-10-25

- Root cause: declared measured social reads were missing from the existing content orchestrator's explicit DirectQuery table allowlist; the freshness .gte method was not implemented. Provider function log exact fingerprint: DB_TABLE_REJECTED:social_posts at 2026-10-24 22:25:13.089 UTC.
- Impact: COMPANY_PROVIDER_EVIDENCE_READ_FAILED, source-unavailable measured-next-post and no bounded exploration for company channel despite actual provider-linked post snapshots.
- Fix: owned-brand only, two read-only social tables, parameterized observed_at UTC floor, provider JSON normalization and block source writes.
- Single owner: existing powerhouse-content-orchestrator, no new cron, agent or database; exact-source evidence remains required for future claims.
- Regressions: tests/brain-measured-provider-db-source-allowlist-v1.test.mjs and tests/brain-measured-next-post-challenger-v1.test.mjs.
- Evidence and status: candidate only. Required/CodeQL, protected merge, new Edge deploy and genuine next producer evaluation must succeed before closure.
