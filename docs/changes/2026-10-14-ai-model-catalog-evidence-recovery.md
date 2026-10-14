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

The canonical supplier classifier is shared by the worklist, protected freshness test and production-readback audit. It does not accept historical price references, illustrative billing examples, or only a pricing unit as current price verification. Full-scope labels must not be automatically inferred from a source URL or these counters. Any declared-full model, including open-weight models, remains subject to evidence integrity checks; tenant hosting, region, retention and contract controls require separate independent authorization and readback. The protected merge, Required test, CodeQL, and exact production readback remain mandatory.

## Official supplier source cross-check: model-scoped safety, licenses, and retention (2026-10-14)

The following claims were independently inspected in official model-owner documentation on 2026-10-14. These observations do **not** establish customer configuration, tenant entitlement, a signed DPA, data residency or release acceptance. Supplier model-governance evidence must remain separated from runtime/contract evidence.

| Model | Official evidence locator | Supplier observation | Separate unverified boundary |
| --- | --- | --- | --- |
| Claude Opus 4.6 | https://platform.claude.com/docs/en/models/opus-4-6/overview — Specifications / Availability | API ID `claude-opus-4-6`; active legacy; $5 input / $25 output per million tokens; 1M context and 128K output; Claude API, Bedrock, Google Cloud and Microsoft Foundry documented | Region, tenant API access, agreements, ZDR |
| Claude Opus 4.7 | https://platform.claude.com/docs/en/models/opus-4-7/overview — Specifications / Availability | API ID `claude-opus-4-7`; active legacy; $5 input / $25 output per million; 1M context / 128K output; multiple documented platforms | Region, tenant API access, agreements, ZDR |
| Claude Sonnet 4.6 | https://platform.claude.com/docs/en/models/sonnet-4-6/overview — Specifications / Availability | API ID `claude-sonnet-4-6`; active legacy; $3 input / $15 output per million; 1M context / 128K output | Region, tenant API access, agreements, ZDR |
| Claude Haiku 4.5 | https://platform.claude.com/docs/en/models/haiku-4-5/overview — Availability / Good to know | Alias `claude-haiku-4-5` resolves to pinned `claude-haiku-4-5-20251001`; active legacy; retirement not sooner than 2026-10-15 | Retirement is not guaranteed on that date; tenant controls unverified |
| Llama 4 Scout | https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct — Intended Use / Safeguards / License | Llama 4 Community License (not Apache-2.0); Meta describes model-level fine-tuning, recommended Llama Guard/Prompt Guard/Code Shield protections, and deployment-specific safety responsibilities. Model-card image testing was limited to up to five images. | Actual license acceptance, implemented filtering, hosting controls and locality |
| Qwen3-32B | https://huggingface.co/Qwen/Qwen3-32B — License / Model Overview / Use this model | Apache-2.0 weights; 32.8B parameters, native 32,768 context, up to 131,072 using YaRN; local serving examples via Transformers, vLLM and SGLang. | Hosted inference pricing, selected provider's processing/storage regions and access configuration |

Official **Anthropic API retention scope**: https://platform.claude.com/docs/en/manage-claude/api-and-data-retention — *How Anthropic approaches data retention / Zero data retention / Model-specific data retention requirements*. Conversation content is **not retained by default** by the first-party Claude API; designated Covered Models require 30-day retention. ZDR requires per-organization enablement and does not cover every stateful feature. On Bedrock and Google Cloud the cloud platform is the processor and separate controls apply. A generic claim that all Claude API conversation contents are retained for 30 days is therefore inaccurate.

**Classification:** authoritative supplier-page facts inspected, not independent runtime certification. Keep any unresolved model governance or customer claims marked pending and preserve the freshness and tenant-acceptance checks. The large `data/ai-model-catalog-v1.json` file is concurrently edited; a conditional update of the model records returned HTTP 409 and was intentionally not forced.


## Independent model-specific supplier source review — eight additional models (2026-10-14)

Eight exact model-owner pages have been read independently and cross-checked on 2026-10-14. The following are **public supplier assertions**; they are neither authenticated account readbacks nor signed customer-contract controls. No `claim_scope`, `verified_at`, `verification_status`, supplier acceptance gate, or production release state changes as a result of this research.

| Exact catalog model | Official source and precise locator | Observed public supplier claim | Explicitly not established |
| --- | --- | --- | --- |
| `gpt-5.6-sol` | https://developers.openai.com/api/docs/models/gpt-5.6-sol — Pricing / Context window / Endpoints | API model GPT-5.6 Sol, input $4 and output $20 per million, cached input $0.40, 1,050,000 context and 128,000 max output; higher rate tier above 272K input tokens and promotion through at least 2026-11-21 | Contracted price, tenant API entitlement, residency, ZDR |
| `claude-haiku-4-5` | https://platform.claude.com/docs/en/models/haiku-4-5/overview — Model IDs / Availability / Pricing | Claude API alias `claude-haiku-4-5` maps to `claude-haiku-4-5-20251001`; active legacy; retirement *not sooner than* 2026-10-15; 200K context; $1 input/$5 output per million | No proof of actual retirement on 2026-10-15, account access, partner-platform processing or enabled ZDR |
| `grok-4.6` | https://docs.x.ai/developers/models/grok-4.6 — At a glance / Pricing / Details | `grok-4.6`; 500K context, text and image input, $2 input/$6 output per million, $0.50 cached input; displayed region us-east-1; batch unsupported | Account region, contractual service tier, privacy commitments, live API access |
| `deepseek-flash` | https://api-docs.deepseek.com/quick_start/pricing/ — Model Details / Pricing / footnote 1 | `deepseek-flash` maps to DeepSeek-V4.1-Flash; peak token rates $0.30 cache-miss input and $1.20 output per million; off-peak $0.15/$0.60; historical flash IDs route to new model | Customer billing, account access, region, storage/retention or executed DPA |
| `deepseek-v4-pro` | https://api-docs.deepseek.com/quick_start/pricing/ — Model Details / Pricing | `deepseek-v4-pro` maps to DeepSeek-V4-Pro-0813; peak $1.32 cache-miss input/$3.96 output per million; off-peak $0.66/$1.98; no vision indicated | Tenant eligibility, governance/retention, residency or contracted charges |
| `command-a-plus` | https://docs.cohere.com/docs/command-a-plus — Pricing / Model ID / Model Data and Training | API identifier `command-a-plus-05-2026`; 128K context, 64K max output, image + text input; trial and production API keys free within limits; paid production via Cohere Model Vault is a distinct commercial arrangement | Vault quote, monthly commitment, customer-region, enabled data controls |
| `llama-4-scout-17b-16e-instruct` | https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct — Model Information / License | Official Meta weight repository for Llama 4 Scout 17B × 16 experts; 10M token context; **Llama 4 Community License**, not Apache-2.0 | Any default hosted per-token tariff, customer license acceptance, hosting location or security configuration |
| `qwen3-32b` | https://huggingface.co/Qwen/Qwen3-32B — License / Use this model | Qwen3-32B official weights under **Apache-2.0**, local inference examples via Transformers, vLLM and SGLang | No uniform managed-API price or hosted residency; cost and governance depend on selected deployment |

Official API data policies remain distinct from the named model listings. Notably, Anthropic's https://platform.claude.com/docs/en/build-with-claude/api-and-data-retention excludes designated Covered Models from ZDR; a Haiku listing is not proof that ZDR is **enabled** in a specific organization. OpenAI's https://developers.openai.com/api/docs/guides/your-data lists model/endpoint support, but eligibility and residency are not proof of customer configuration.

**Release policy:** supplier-page readbacks can substantiate named public fields and expose contradictions, but full supplier acceptance requires independently reviewed current model-specific claims and correct `claim_scope` with no unresolved conflicts. Customer acceptance separately requires authorized runtime and contract proof. Do not count these eight page reviews as eight fully approved models.


## Further independent specialist-model source review (2026-10-14)

Nine further exact official model pages were inspected. This records **public provider model facts only**. Source-page presence, token-price examples, and model-card licensing do not imply live tenant capability, enabled data controls or actual contracted billing.

| Catalog model | Official model page and exact locator | Supplier-page observation | Acceptance caveat |
| --- | --- | --- | --- |
| `gpt-image-2` | https://developers.openai.com/api/docs/models/gpt-image-2 — Modalities / Endpoints | Default image-generation and editing model; text input and image input/output; Images `v1/images/generations` and `v1/images/edits` documented | No model/account endpoint entitlement or customer storage controls inferred |
| `gpt-image-2.5-flare` | https://developers.openai.com/api/docs/models/gpt-image-2.5-flare — Pricing | Official image token rates per million: $8 input, $2 cached input, $30 output; text input $5 | Token-type price is not a fixed delivered-image cost; account and regional billing not tested |
| `gpt-image-2.5-sunburst` | https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst — Pricing | Same published image-token rates $8 input, $2 cached input, $30 output per million; text input $5 | Image quality/size and token consumption determine charges; no customer attestation |
| `text-embedding-3-large` | https://developers.openai.com/api/docs/models/text-embedding-3-large — Pricing | $0.13 per million input tokens for embeddings, provider model page | No customer API entitlement, contract terms or tenant data settings inferred |
| `text-embedding-3-small` | https://developers.openai.com/api/docs/models/text-embedding-3-small — Pricing | $0.02 per million input tokens for embeddings, provider model page | No tenant API entitlement, contract terms or processing region inferred |
| `grok-4.7` | https://docs.x.ai/developers/models/grok-4.7 — Pricing / Details | 500K context, $2 input/$6 output per million and $0.50 cached input; shown US-east-1; Batch API not supported | Model-specific price is context-/region-sensitive and no authenticated runtime was tested |
| `grok-imagine-video` | https://docs.x.ai/developers/models/grok-imagine-video — Pricing / Details | Video output headline $0.05 per second; resolution-specific 720p $0.07/s; image input $0.002 and video input $0.01/s. The nominal rate alone must **not** be applied to all resolutions or input types | No region-specific customer rate, contract, API call or generation acceptance |
| `shieldstral-1` | https://docs.mistral.ai/models/shieldstral-1-0 — Description / Weights | Open-weight policy moderation model, 3.8B parameters, 32K context, Apache-2.0 weight license; multimodal text/image classification | No managed token tariff should be invented for self-host weights; actual license obligations and runtime controls remain unverified |
| `leanstral-1.5` | https://docs.mistral.ai/models/leanstral-1-5 — Model code / Deprecation | API identifier `labs-leanstral-1-5`, 256K context and 128K max output; deprecated 2026-09-29 and being phased out | Do not automatically treat deprecated as active nor infer current production access or billing |

These public observations were separately stored in the live catalog's `independent_model_source_review_20261014` field when no existing review for that exact model was present, with `customer_verified=false` and `release_eligible=false`. As before, supplier six-claim sign-off, protected CI, merge, exact production readback and any tenant contracts remain separate required controls.
