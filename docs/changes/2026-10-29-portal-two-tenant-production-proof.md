# Herstelkandidaat — portal-two-tenant-production-proof

Fingerprint: `portal|authenticated-two-tenant-production-proof|20261029`. Status: **CANDIDATE / NOT LIVE / CI PENDING**.

## Aantoonbare fout
Production Release Readback skipped authenticated portal proof when the change classification was only website; the existing synthetic deployment proof checked only one Identity tenant, insufficient to demonstrate independent cross-tenant isolation.

## Wijziging
Run two distinct Identity JWT-authenticated HTTPS requests against immutable deployed portal API, require correct subjects/tenant claims, distinct response scopes, no opposing-tenant marker, and cleanup of both accounts. Widen exact readback applicability to this runtime path, require two-tenant assertions.

## Structurele preventie
Permanent fail-closed production gate: verify two tenant scopes and payload shapes with count=2, cleanup DELETED, exact source SHA and deploy ID; never claim real customer proof or independently tested isolation from synthetic evidence alone.

## Acceptatie
- Regressie: `tests/portal-authenticated-production-proof.test.mjs`
- Regressie: `tests/brain-runtime-authenticated-production-readback-required-v1.test.mjs`
- Protected Required + CodeQL on immutable PR head; respect canonical writer lease and branch protection.
- Exact GitHub main to Netlify production identity plus independent public route/API readback.
- For portal: two separate real JWT-authenticated *synthetic* tenants, negative isolation proof and successful deletion; this does not establish access to actual customer accounts.
- No new publisher, scheduler, provider spend, synthetic sales outcome or green status before verification.

Referenties: #4215 #5118.
