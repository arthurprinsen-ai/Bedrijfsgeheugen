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


---

# Supplier verification: GPT-6 Astra (2026-10-14)

This is a **partial, independently inspectable supplier-source observation**, not catalog-level approval.

Source: https://developers.openai.com/api/docs/models/gpt-6-astra
Observed on 2026-10-14 (official provider model documentation).

| Claim | Locator on official page | Observed value | Assessment |
| --- | --- | --- | --- |
| model_id | Models / GPT-6 Astra heading | GPT-6 Astra | Supported model label |
| status | Model heading / Default and public pricing | Listed in official API model docs | Listed, but tenant access not independently tested |
| pricing | Pricing / Text tokens / Per 1M tokens | Input $10; cached input $1; output $50; long-context and mode multipliers apply | Supported |
| capabilities | Modalities | Text input/output; image input; audio and video not supported | Supported |
| deployment | Endpoints | Chat Completions v1/chat/completions; Responses v1/responses listed | Documentation-supported, not authenticated endpoint invocation |
| governance | Model page alone | No independently complete model-specific storage, regional inference, retention, or customer controls verified | UNVERIFIED |

The generic supplier-privacy baseline is **not** proof of a tenant's enabled controls, contract, data residency, or zero-data-retention settings. This record does not create a `claim_scope: full` assertion or change the production acceptance gate.

Evidence follow-up: corroborate governance against the exact official policy and product availability; verify any conflicting catalog claims; only then enter supported, dated per-claim receipts in `data/ai-model-catalog-v1.json` and run the protected freshness test.

## Evidence gap classification (2026-10-14 follow-up)

The 110-model supplier worklist was re-read from `data/ai-model-catalog-v1.json` on the PR branch after supplier-source corrections. At that readback the 150 pending claim reviews split into:

- **35 absent claim-evidence records** (no receipt object for the model/claim).
- **4 incomplete claim-evidence records** (receipt exists but no non-empty observed value).
- **111 scope-insufficient records** (a cited observed value exists, but the supplier-audit deliberately still requires deeper verification; provider-wide policies, tenant-specific governance assertions, and deployment-specific prices cannot silently count as model-specific certification).

By claim, the 150 are: governance 105, pricing 30, status 6, model_id 3, capabilities 3, deployment 3.

This is an audit of the existing catalog's evidence *structure and scope*, not an approval of any pending claim. Source existence and HTTP reachability alone do not establish a specific customer's DPA, enabled zero-data-retention setting, region of processing, contract terms, model entitlement, or authenticated cloud endpoint.

**Resolution lanes**: (1) Fill 35 absent claims from exact authoritative model or product documentation; (2) fill four empty observed values only after checking the cited source; (3) for 111 scope-insufficient claims, assess model/provider/region and commercial-SKU applicability and keep customer-dependent controls behind the separate authorized tenant readback and contract verifier. The existing protected freshness gate and customer-governance controls remain unchanged.



## Supplier evidence checkpoint (2026-10-14, classifier reconciliation)

The 110-model catalog has 660 required supplier claim positions. At this checkpoint, 530 positions contain an inspectable model-scoped supplier-source receipt **awaiting independent validation**, 96 have general provider-policy information **not specific-model governance proof**, and 34 have no adequate current/model-specific receipt (including incomplete or historical price references). Total lacking complete model-scoped source receipts: 130. These are source-completeness metrics, **not** a count of verified claims.

```
OpenAI: 18 source gaps / 20 models
Anthropic: 10 source gaps / 11 models
Google: 21 source gaps / 21 models
Mistral AI: 22 source gaps / 22 models
xAI: 5 source gaps / 5 models
DeepSeek: 0 source gaps / 2 models
Cohere: 10 source gaps / 7 models
Meta: 6 source gaps / 1 models
Alibaba/Qwen: 6 source gaps / 1 models
Amazon: 25 source gaps / 13 models
TII/Falcon: 7 source gaps / 7 models
```

The canonical supplier classifier is shared by the worklist, protected freshness test and production-readback audit. It does not accept historical price references, illustrative billing examples, or only a pricing unit as current price verification. Full-scope labels must not be automatically inferred from a source URL or these counters. Two currently declared-full open-weight models remain subject to independent review and customer-specific controls on hosting, region and retention. The protected merge, Required test, CodeQL, and exact production readback remain mandatory.
