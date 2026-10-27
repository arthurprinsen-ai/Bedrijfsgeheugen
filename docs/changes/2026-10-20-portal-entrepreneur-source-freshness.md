# Entrepreneur source freshness and monetary evidence guard
Parent [P0 #4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215). Obligation: `portal|entrepreneur-snapshot-evidence-freshness|20261020`.

## Direct observed failure
The existing authenticated Supabase `portal-state-eu` entrepreneur read-model computed `status:signals.length?'CURRENT':'EMPTY'` independently of the canonical `powerhouse_intelligence_snapshot_v1.refreshed_at`. Its fallback `new Date().toISOString()` forged recent source time when the canonical snapshot was absent. Numeric conversion `Number(null)=0` made `sumKnown` and `maxKnown` turn unknown impacts into observed zero values.

Production #4215 readback found the Source Universe snapshot stuck at 2026-10-20 07:02:56 UTC (169 signals) despite a later expected scheduler slot; source `CURRENT` metadata was not trustworthy. Proven post-migration automatic :54 callback remains missing, and `GET /api/portal-ondernemersdata` previously timed out with authenticated HTTP 504: this is not fixed by this change.

## Single existing source of truth
A pure `entrepreneur-snapshot-truth.js` helper lives alongside the existing `portal-state-eu` Edge code, re-used by that route. No new frontend store, scheduler, AI layer, provider connector or claim of source ingestion:
- `finiteEvidence/sumKnownEvidence/maxKnownEvidence` return null for missing/blank/bool values. Actual measured 0 remains 0.
- `entrepreneurSnapshotFreshness` marks `CURRENT` only if the actual canonical snapshot timestamp is valid, no more than two hours old and at least one source signal observed in the last seven days. Expired or missing snapshot is `STALE`; genuinely empty, recent snapshot is `EMPTY`; stale signal events or canonical `PARTIAL` remain `PARTIAL`.
- Return original source timestamp (or null), never a request-time substitute; add `source_health.snapshot_freshness` to support visual indicators and follow-up recovery.
- Preserve authenticated-tenant scoping and real customer impact overlays. No fabricated monetary, model, CSRD or forecast records.

## Production acceptance
Required CI/CodeQL, Supabase Edge source contract/preview and exact release-readback must succeed. Later authenticated tenant-specific `/api/portal-ondernemersdata` must return 200 with tenant ownership and real `STALE`/source timestamp when aged. Prior HTTP 504 and cron stage failure are independently open blockers and cannot be turned green by status mapping.
