# AI model catalog evidence recovery — 2026-10-14

Obligation-ID: ai-model-catalog-evidence-recovery-20261014

This change corrects selected OpenAI model entries and introduces an evidence audit of the 110-record catalog. URL reachability is explicitly not claim verification. The existing 14-day freshness gate remains active. Vendor-by-vendor verification, protected CI, CodeQL and production readback remain mandatory.

## Release verification and production readback

The protected freshness test requires claim-level evidence for each of the six dimensions for every model. An HTTP 200 response from a supplier does not prove a claim. The catalog remains blocked unless all six receipt fields are complete, source-backed and within 14 days; do not mass-update verification dates.

The existing audit supports an opt-in exact production readback via `MODEL_CATALOG_PRODUCTION_URL` set to the absolute HTTPS URL for the deployed canonical model catalog JSON (not an HTML page). Example release-job command:

```sh
MODEL_CATALOG_PRODUCTION_URL=https://<actual-production-host>/<actual-catalog-path>.json node tests/ai-model-catalog-evidence-audit.mjs
```

Replace the host/path with the actual deployed artifact. The audit compares SHA-256 of parsed JSON and expected catalog version/model count, fails on HTTP errors and mismatches, and produces an explicit production-readback status. No URL means NOT_REQUESTED, never LIVE_PROVEN. The release workflow must supply the production URL and must check this audit exit code after a protected merge/deploy. This PR by itself does not establish a production readback or prove supplier claims.

Release-mode invocation must set both `MODEL_CATALOG_REQUIRE_PRODUCTION_READBACK=1` and `MODEL_CATALOG_PRODUCTION_URL` to the deployed canonical JSON artifact URL. An absent URL fails with `PRODUCTION_URL_REQUIRED`, never a passing production attestation. Production readback must be a post-deployment protected check; this audit does not deploy the application or verify vendor claims.

## Tenant contract and security attestation boundary

Supplier-level documentation is NEVER evidence that a particular customer's DPA is signed, processing/storage is in the requested region, zero-data-retention is enabled, CMK is deployed, or private networking is active. Such assertions require separate evidence and must not be inferred from catalog governance flags.

When any of `dpa`, `signed_dpa`, `contract`, `tenant_data_residency`, `tenant_zdr`, `customer_cmk` or `private_networking_enabled` is asserted in `verification_evidence.verified_claims`, both protected freshness test and audit now require a corresponding `verification_evidence.tenant_evidence[]` entry with:
`claim`, `scope: "customer_specific"`, `tenant_id`, `approved_by`, `evidence_reference`, and `checked_on` matching the review date.

Only record opaque evidence references in the public repository. Signed agreements, confidential contract terms, customer identifiers and security attestations belong in access-controlled storage. Do not claim a tenant is approved solely on public documentation or generic vendor assurances. These fields are presence checks; independent document verification and tenant-configuration readback remain separately required before production approval.
