# 2026-11-14 — contact authority preservation on original enrichment chain

Fingerprint: `powerhouse|contacts|daily-refresh-erases-email-authority|20261114-v1`
Original owner: Powerhouse identity graph cron #138 + commercial learning cron #116; incident lineage #4198. Protected candidate PR #5785.

## Observed production evidence (no PII)
- Canonical connections: 23,295, including 605 with a syntactically valid stored e-mail address; no newly fetched external addresses verified. Imported sources are primarily LinkedIn export; this is not permission to scrape or send.
- All 23,295 had daily dated context refresh on 2026-11-14. At the original observation, only 12,445 had a dated e-mail authority review; 10,850 still lacked today's review. Counts are a timestamped snapshot, not terminal provider truth.
- Read-only `pg_get_functiondef` confirmed both original `powerhouse_refresh_all_connection_enrichment_v1(date,integer)` and `powerhouse_refresh_connection_enrichment_batch_v1(date,integer)` overwrite the `email_authority` JSON field when rebuilding `source_snapshot` on conflict.
- The original #138/#116 cron are active with recent successful executions; that is not proof of external email lookup, source ingestion, legal send authority, ONE BRAIN named consumer processing or downstream revenue.

## Corrective contract (not yet live-proven)
One source-anchored idempotent migration preserves the original e-mail-authority review JSON key while retaining fresh daily core and decision; stale reviewed dates stay stale. Two original refresh paths are checked. No new sender, cron, table, RLS exception, paid service or LinkedIn scraping. Original full graph refresh and protected source delivery remain owners.

A dependency-free `tests/brain-contact-authority-refresh-preservation-20261114.test.mjs` enforces both code paths and negative safety guards. Original Powerhouse enrichment skill now requires separate daily metrics for existing evidence context, real provenance-backed new addresses, explicit permission review, and named consumer `PROCESSED` ACK.

## Evidence of progression
Original PR #5785 head at creation was `c5fbd36cc5ca2738f39d260be9ad55c17da1ff70`. Required run #43619262327 failed a SQL-literal test assertion; source-matching assertion corrected in same candidate. Exact-head protected Required/CodeQL/Supabase Preview, merge, production SQL implementation, consumer ACK and new-email actual growth remain pending independent verification. Never label GREEN from this document, an active cron, a PR, or a green context refresh alone.

## Next original-owner step
Pass protected gates; merge only via original authorized delivery; read back both production function definitions, then measure that already-reviewed `email_authority` survives original full refresh and that today's authority review completes 23,295/23,295. For acquisition, only verifiable, authorized first-party/public business sources with lawful purpose and source linkage; zero fresh addresses is explicit OPEN. Keep one commercial and ONE BRAIN lineage #4198 with 24/72h effect follow-ups.

## Protected admission scope correction

Required run #43619415797 passed the original learning evidence gate but rejected `SCOPE_CONTAMINATED` because `Change-Scope` must be a comma-separated allowlist of the exact **five non-verification** paths, not the number of files. The separate verification test is exempt from the scope budget by the repository's existing trusted guard. The original PR metadata was corrected to that five-file exact allowlist and `Scope-Budget: 5`; no broad-approval label, security exception, or bypass was used. The current protected exact-head checks must pass independently before release.
