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

## Private tenant attestation acceptance

`node tests/ai-model-tenant-acceptance.mjs /private/attestations.json` validates a separately supplied tenant evidence manifest. It rejects missing private input, stale evidence, absent approval, unsupported claims, mismatched expected/observed values, unsigned evidence, invalid Ed25519 signatures and missing readback metadata. Set `TENANT_ATTESTATION_VERIFY_PUBLIC_KEY_PEM` to the pinned, trusted attestation signing public key. The signer must be an independent authorized reviewer; never commit the private manifest, tenant identifiers, confidential contracts, signing keys or provider credentials.

**Important boundary:** A signed manifest is an *attestation*; it is not itself a live provider API request or independent contract-signature verification. An approved verifier must inspect the signed agreement in the contract repository, query the actual authenticated tenant configuration at the provider, verify the readback identity and values, then sign the manifest. The verifier and vault integrations are not wired into this repository by this change. Until real contract-vault and provider adapters exist, production acceptance must remain blocked. The existing supplier freshness check and protected merge requirements remain in force.

## Authenticated provider readback mode

The private tenant acceptance script now supports `TENANT_LIVE_READBACK_REQUIRED=1`, `TENANT_LIVE_READBACK_ENDPOINT`, `TENANT_LIVE_READBACK_ALLOWED_ORIGIN` and `TENANT_LIVE_READBACK_TOKEN`. For each non-contract control, it posts the tenant, provider, model and claim to a pinned HTTPS endpoint using bearer authorization and rejects connection failures, redirect attempts, mismatched identity or value, and stale observations. All environment variables must be injected from access-controlled CI secrets, never stored in the catalog.

**Integration boundary:** this requires an independently implemented and authenticated provider-specific gateway that performs the actual tenant API retrieval. The generic endpoint contract alone is not that gateway. Until such a gateway is deployed, authenticated, permitted and tested against real customer accounts, release verification remains blocked. Contract signature authenticity still requires an approved contract repository verifier. The supplier freshness gate is unchanged.

## Mandatory runtime controls (hardening)
All non-contract tenant security claims now require the pinned HTTPS provider readback, without an opt-out. Missing gateway credentials or a missing verified tenant response block tenant acceptance. This does not create a provider adapter or establish authenticated evidence; release remains blocked until those integrations are live and independently confirmed.

## Connection readiness

Run `node tests/ai-model-tenant-connection-readiness.mjs` on the protected runner. Supply the configured contract-verification endpoint, allowed HTTPS origin, authorization token, provider-readback endpoint, allowed HTTPS origin, authorization token, and trusted attestation public key from access-controlled runner configuration. Do not commit credentials or contracts. A configured connection is not proof of contract authenticity or provider settings. Run tenant acceptance on independently verified restricted evidence after the gateways are authorized; release remains blocked until supplier verification and production checks pass.

## Protected production connection configuration

Configure the following keys in the protected deployment/CI secret manager, not in GitHub source code:

| Key | Purpose |
| --- | --- |
| `TENANT_CONTRACT_VERIFY_ENDPOINT` | HTTPS contract-vault verification endpoint |
| `TENANT_CONTRACT_VERIFY_ALLOWED_ORIGIN` | Pinned HTTPS contract-vault origin |
| `TENANT_CONTRACT_VERIFY_TOKEN` | Restricted contract-verification credential |
| `TENANT_LIVE_READBACK_ENDPOINT` | HTTPS provider-configuration gateway endpoint |
| `TENANT_LIVE_READBACK_ALLOWED_ORIGIN` | Pinned HTTPS provider-gateway origin |
| `TENANT_LIVE_READBACK_TOKEN` | Restricted provider readback credential |
| `TENANT_ATTESTATION_VERIFY_PUBLIC_KEY_PEM` | Trusted verification public key |

Assign production-only scopes and least-privilege access, with rotation and revocation support. Never invent endpoint values or set placeholder credentials. The endpoints must correspond to real independently administered services. Test connection readiness using `node tests/ai-model-tenant-connection-readiness.mjs`, then run `node tests/ai-model-tenant-acceptance.mjs /secure/attestations.json` with genuine restricted evidence and provider readbacks. The readiness result alone is not customer verification. Required CI, CodeQL, supplier claims and exact production catalog readback remain release prerequisites.
