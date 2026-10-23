# 2026-10-22 — archived tenant/trigger source replay recovery

- Fingerprint: `ci|brain|archived-sql-readpath|tenant-trigger|20261022-v1`
- Source baseline: `4ce0846ca51227169389241d3a122b274795a0b2`
- Root cause: historic Node source-contract paths point to retired executable SQL instead of immutable repository-only originals.
- Evidence: BRAIN `39791707071` (355 failed; original `39671036043` 321 failed), exact original archive blobs `a6037047760fe281ab24298f9f7d94c62cc95695`, `322fee022b78584346f1970e290e7cf763a1147a`.
- Action: two path corrections, original tests retained, two new archive/no-executable-duplicate regression cases, canonical Brain learning entry.
- Prevention: exact historical source identity; zero executable historic migration duplicates; preserve tenant/RLS/outreach guards.
- Verification: SOURCE_READBACK_PROVEN; EXACT_HEAD_CI_PENDING; FULL_BRAIN_PENDING; SUPABASE_PREVIEW_PARITY_PENDING; PRODUCT_CUSTOMER_ACCEPTANCE_PENDING.
- Production side effects: NONE. No fictitious green or hidden test failures.
