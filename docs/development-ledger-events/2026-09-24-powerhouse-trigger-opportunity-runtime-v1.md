# 2026-09-24 — MKB trigger opportunity runtime v1

Fingerprint: `powerhouse-trigger-opportunity-runtime-v1`

Added the executable bridge from observed company triggers into the existing Powerhouse commercial lineage. The runtime is deliberately conservative: no market signal becomes a company opportunity, no trigger creates invented revenue, and no trigger alone unlocks provider outreach.

Artifacts:
- migration: `20260924154000_powerhouse_trigger_opportunity_runtime_v1.sql`
- ingest: `powerhouse-company-trigger-ingest`
- regression: `supabase-powerhouse-trigger-opportunity-runtime-v1.test.mjs`
- learning + human documentation

Production proof must include provider readback and a rollback-safe canary.
