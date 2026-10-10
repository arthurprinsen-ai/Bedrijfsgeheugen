# Development ledger: Mira midnight source assurance (2026-10-09)

- Parent: P0 #4198. Single existing Powerhouse/Heartbeat/Brain source, scheduler and assurance authority retained.
- Prior defect: next-day source harvest at 20:02 UTC incorrectly judged by local-after-midnight `updated_at` predicate. Quality gate also counted unqualified sources.
- Actual evidence: 36 source observations during 2026-10-08 20:02 UTC harvest, 12 eligible; real Dutch consumer complaint examples and irrelevant Nederland/Texas noneligible records.
- Root-cause correction: source freshness rolling 24h and existing quality fields `eligible`, `evidence_score` and `total_score` enforced; no new table, cron, publisher or fake outcome.
- Security: existing public function ownership and privilege surface preserved; migration asserts anon/auth denied, service role allowed. No changes to RLS, secrets or provider tokens.
- Regression and change records are in the same protected delivery lineage. Terminal proof requires protected CI, merge, actual migration application, fresh qualified-source readback, regression assurance refresh and independently verified status.
- Channel publication still requires exact Mira media and actual Instagram provider confirmation; provider statuses cannot inherit source-radar GREEN.
