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


## Third supplier-page readback: voice, legacy, hosted open weights and Bedrock (2026-10-14)

Nine more supplier pages were checked for model-specific ID, lifecycle, pricing, delivery method or capability. These are **public-source facts, not full claim verification**. Do not infer customer-region status, executed DPA, active subscription, current account billing or enabled privacy configuration.

| Model ID | Official model-owner evidence URL / locator | Observed on supplier page | Unverified boundary |
| --- | --- | --- | --- |
| `grok-voice-transcribe-2.0` | https://docs.x.ai/developers/models/speech-to-text — At a glance / Pricing / Availability | Default xAI audio-to-text model; REST $0.10 per audio hour, streaming $0.20/hour; us-east-1 displayed, 38+ languages | Account entitlement and negotiated rate |
| `claude-fable-5` | https://platform.claude.com/docs/en/models/fable-5/overview — Specifications / Pricing / Availability | Active legacy listing, $10 input/$50 output per MTok, 1M context / 128K output; Covered Model retention remains a **separate model-specific policy**, not generic ZDR | Customer enablement and 30-day processing controls |
| `claude-opus-4-8` | https://platform.claude.com/docs/en/models/opus-4-8/overview — Pricing / Model IDs | Legacy `claude-opus-4-8`, 1M context, 128K output, $5 input/$25 output per MTok | Tenant-region/platform retention, actual access |
| `mistral-medium-3.5` | https://docs.mistral.ai/models/mistral-medium-3-5-26-04 — Model ID / Features / Pricing | Mistral Medium 3.5 model code `mistral-medium-3-5`, GA v26.04, Modified MIT open weights, 256K context, $1.50 input/$7.50 output per million; chat/agent endpoints listed | Hosting license terms, enabled EU processing or actual customer usage |
| `zai-glm-5.3` | https://docs.mistral.ai/models/zai-glm-5-3 — Model ID / Pricing / Model origin | Z.ai third-party open weights served by Mistral without modifications; `zai-glm-5-3`, GA September 2026, 1M context, 128K max output, $1.40 input / $0.14 cached / $4.40 output per million | Z.ai weights do **not** automatically establish Mistral hosting-region/contract controls |
| `zai-glm-5.2` | https://docs.mistral.ai/models/zai-glm-5-2 — Deprecation / Model ID | Third-party `zai-glm-5-2`, deprecated September 29, 2026, replacement GLM 5.3, 1M context and 128K output | Do not recommend as current default; exact tenant retirement/access and pricing unverified |
| `amazon-nova-2-lite` | https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-lite.html — Model Details / APIs | AWS Bedrock lifecycle Active; EOL no sooner than December 2, 2026; 1M context, 64K output, bedrock-runtime Invoke/Converse | AWS account and region availability; live price and data controls |
| `amazon-nova-2-sonic` | https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-sonic.html — Model Details / APIs | AWS Bedrock lifecycle Active; EOL no sooner than December 2, 2026; 1M context; realtime speech and text via bedrock-runtime; no Invoke/Converse on model card | Account region, streaming entitlement, current tariffs |
| `amazon-titan-text-embeddings-v2` | https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-titan-text-embeddings-v2.html — Model Details / lifecycle date | Model card currently labels Active, 8K token context, Amazon Bedrock Invoke. **The same page contains an internally inconsistent “EOL no sooner than 2025-04-30” and “Model EOL date: No sooner than 4/30/2024”**. Preserve that discrepancy; do not derive a definitive model EOL date from it. | Authorized regional `GetFoundationModel.modelLifecycle` needed; no customer-provider confirmation |

This checkpoint does not modify the fail-closed freshness test or mark any tenant controls as verified. The nine public-page observations are stored as independent review context in Supabase and checked by readback; the two conflicting date fields for Titan Text Embeddings V2 are an unresolved provider-documentation ambiguity rather than evidence for turning the model EOL automatically.


## Fourth independent source pass: model aliases, open weights and AWS model cards

Checked directly against official model-owner pages on 2026-10-14. The following observations never imply model account entitlement, negotiated hosting prices, contract signatures or release eligibility.

| Catalog model | Supplier URL | Exact public observation |
| --- | --- | --- |
| `gpt-oss-120b` | https://developers.openai.com/api/docs/models/gpt-oss-120b | Downloadable open weights, Apache-2.0, 117B parameters/5.1B active, 131,072-token context, single H100-class device possible. Model-page API rate-limit tiers show zero throughput; do not interpret the general endpoint list as a paid OpenAI API inference offer. |
| `gpt-oss-20b` | https://developers.openai.com/api/docs/models/gpt-oss-20b | Downloadable Apache-2.0 weights, 21B parameters/3.6B active, 131,072-token context; provider shows zero hosted API throughput in listed account tiers. |
| `command-a` | https://docs.cohere.com/v2/docs/command-a | Canonical Cohere API ID `command-a-03-2025`, not a proven generic `command-a` alias; $2.50 input/$10 output per million tokens; 256K context, 8K output. |
| `embed-4` | https://docs.cohere.com/docs/cohere-embed | Canonical API ID `embed-v4.0`; text and image/PDF embeddings, 128K context and configurable output dimensions. Pricing for Cohere Model Vault is separate from hosted API tariff. |
| `rerank-4-pro` | https://docs.cohere.com/v2/docs/rerank | Canonical API ID `rerank-v4.0-pro`, multilingual reranking for text and semistructured JSON; published listing does **not** establish the per-search/API billing rate. |
| `codestral` | https://docs.mistral.ai/models/codestral-25-08 | Canonical API model code `codestral-2508`; GA v25.08, 128K context, code completion and fill-in-the-middle, $0.30 input/$0.90 output per million. |
| `mistral-ocr-4-1` | https://docs.mistral.ai/models/ocr-4-1 | GA OCR 4.1, API ID `mistral-ocr-4-1`, $4/1,000 ordinary pages and $5/1,000 annotated pages; /v1/ocr and batch APIs. |
| `amazon-nova-micro` | https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-micro.html | Model card says Active, 128K context, 5K max output, text-only; EOL statement is an earliest-not-before date, **not** proof of actual retirement. |
| `amazon-nova-pro` | https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-pro.html | Model card says Active, 300K context, 5K max output, multimodal text/image/video input; actual AWS region and entitlement not inspected. |
| `amazon-titan-image-generator-g1-v2` | https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-titan-image-generator-g1-v2.html | Official AWS card shows model EOL date 2026-06-30 while still labelling lifecycle Legacy. That is a real provider-document conflict; preserve `CONFLICT` and avoid recommendations until modelLifecycle is checked for the user's AWS account/region. |

**Evidence boundary:** all 10 are public model-source reviews only, copied to scoped Supabase `catalog_record.independent_model_source_review_20261014` and verified with a database readback. Alias differences are **not** automatically promoted to equivalent API IDs. The existing 110-model supplier and tenant acceptance gates remain enforced.


## Falcon exact-model public source verification (2026-10-14)

Exact official Technology Innovation Institute-owned Hugging Face model repositories reviewed individually on 2026-10-14. This inspection establishes repository identity, public weights, stated weight-license category and example local inference paths, **not** a commercial hosted inference tariff or customer legal/runtime acceptance.

| Catalog model | Official model owner URL | Family/type | Repository weight license |
| --- | --- | --- | --- |
| `falcon-h1-0.5b-instruct` | https://huggingface.co/tiiuae/Falcon-H1-0.5B-Instruct | 0.5B | Falcon-LLM |
| `falcon-h1-1.5b-instruct` | https://huggingface.co/tiiuae/Falcon-H1-1.5B-Instruct | 1.5B | Falcon-LLM |
| `falcon-h1-3b-instruct` | https://huggingface.co/tiiuae/Falcon-H1-3B-Instruct | 3B | Falcon-LLM |
| `falcon-h1-7b-instruct` | https://huggingface.co/tiiuae/Falcon-H1-7B-Instruct | 7B | Falcon-LLM |
| `falcon-h1-34b-instruct` | https://huggingface.co/tiiuae/Falcon-H1-34B-Instruct | 34B | Falcon-LLM |
| `falcon-h1r-7b` | https://huggingface.co/tiiuae/Falcon-H1R-7B | 7B reasoning | Falcon-LLM |
| `falcon-ocr` | https://huggingface.co/tiiuae/Falcon-OCR | OCR vision-language | Apache-2.0 |

The Falcon-H1/H1R model cards document Transformers, vLLM and related local/self-hosting methods; this does **not** imply a TII-provided paid API. Pricing per hosted token is therefore **unverified**, not zero: hosting GPU/network/storage and any commercial-license costs depend on the operator. The Falcon-H1 License requires independent license interpretation, while Falcon-OCR's Apache-2.0 weight license is distinct. No customer hosting region, license acceptance, executed DPA, ZDR or applied processing control has been inspected. These seven public model-source checks remain `release_eligible=false`; supplier and protected production validation remain mandatory.


## Mistral six model-owner page review: IDs, pricing and deployment (2026-10-14)

Six exact Mistral model-owner pages were read. The catalog's friendly display IDs are not automatically callable provider API aliases; the concrete model IDs below are sourced from their respective supplier pages.

| Catalog ID | Official supplier source | Actual supplier API ID | Published USD rate | Source-backed notes |
| --- | --- | --- | --- | --- |
| `ministral-3-14b` | https://docs.mistral.ai/models/ministral-3-14b-25-12 | `ministral-14b-2512` | $0.20 input / $0.20 output per 1M tokens | 256K; Apache-2.0; local deployment and Mistral chat/batch |
| `ministral-3-8b` | https://docs.mistral.ai/models/ministral-3-8b-25-12 | `ministral-8b-2512` | $0.15 input / $0.15 output per 1M tokens | 256K; Apache-2.0; text and vision; local and chat/batch |
| `ministral-3-3b` | https://docs.mistral.ai/models/ministral-3-3b-25-12 | `ministral-3b-2512` | $0.10 input / $0.10 output per 1M tokens | 256K; Apache-2.0; local and chat/batch |
| `mistral-large-3` | https://docs.mistral.ai/models/mistral-large-3-25-12 | `mistral-large-2512` | $0.50 input / $1.50 output per 1M tokens | 256K; 41B active/675B total MoE; chat, batch and agents |
| `mistral-small-4` | https://docs.mistral.ai/models/mistral-small-4-0-26-03 | `mistral-small-2603` | $0.15 input / $0.60 output per 1M tokens | 256K; Apache-2.0; 119B total/6.5B active; hybrid coding and reasoning |
| `mistral-ocr-3` | https://docs.mistral.ai/models/ocr-3-25-12 | `mistral-ocr-2512` | $2 per 1,000 pages / $3 per 1,000 annotated pages | Available for existing integrations; /v1/ocr and /v1/batch; OCR 4 newer |

All prices are the provider's published standard product rates and **not** evidence of negotiated customer charges, region, quota, account access, signed contract, specific endpoint data-retention or residency. Open-weight license scope and local deployment are distinct from paid hosted inference. Six public-source reviews only; full supplier certification, tenant governance, Required/CodeQL, protected merge and production parity remain blocked until separately proven.

## Cohere API identity readback and mapping — 2026-10-14

GitHub's path-level fetch may return only metadata for the large (~1.1 MB) catalog. The exact tree entry's Git blob SHA can be read through the authenticated GitHub blob endpoint, then parsed and compared without replacing unseen catalog content. This workflow preserves the 110-model catalog and existing customer/governance holds.

Official Cohere sources: [Command A](https://docs.cohere.com/docs/command-a) confirms `command-a-03-2025`, 256K context, image input and USD 2.50/10.00 per million input/output tokens; [Command A+](https://docs.cohere.com/docs/command-a-plus) confirms `command-a-plus-05-2026`, 128K context and image input. The provider API ID is now recorded separately from the catalog-friendly alias using existing `provider_api_id` convention. No token-based rate is invented for A+.

Regression: `tests/brain-ai-model-catalog-evidence-recovery.test.mjs` asserts canonical IDs, pricing, contexts and fail-closed supplier recommendation gates. **No customer contract, enabled Cohere account settings, region or production acceptance is attested by these public documents.** Protected CI and exact production readback still required.


## Eight Anthropic exact-model model-owner reviews (2026-10-14)

Eight official Claude Platform exact model pages were inspected for API model ID, dated lifecycle, published token price and context/output ceilings. These are public supplier-page facts, not tenant account credentials, retention setting proof or signed commercial terms.

| Catalog model | Official model-specific source | Supplier lifecycle | USD input/output per million tokens | Context / max output |
| --- | --- | --- | --- | --- |
| `claude-opus-4-6` | https://platform.claude.com/docs/en/models/opus-4-6/overview | legacy | $5/$25 | 1M /128K |
| `claude-opus-4-7` | https://platform.claude.com/docs/en/models/opus-4-7/overview | legacy | $5/$25 | 1M /128K |
| `claude-opus-5` | https://platform.claude.com/docs/en/models/opus-5/overview | legacy | $5/$25 | 1M /128K |
| `claude-opus-5-5` | https://platform.claude.com/docs/en/models/opus-5-5/overview | latest | $4/$20 | 1M /128K |
| `claude-sonnet-4-5-20250929` | https://platform.claude.com/docs/en/models/sonnet-4-5/overview | deprecated, scheduled retirement 2026-11-30 | $3/$15 | 200K /64K |
| `claude-sonnet-4-6` | https://platform.claude.com/docs/en/models/sonnet-4-6/overview | legacy | $3/$15 | 1M /128K |
| `claude-sonnet-5` | https://platform.claude.com/docs/en/models/sonnet-5/overview | legacy | $2/$10 | 1M /128K |
| `claude-sonnet-5-5` | https://platform.claude.com/docs/en/models/sonnet-5-5/overview | latest | $2/$10 | 1M /128K |

*Important:* Anthropic's first-party Claude API, AWS Bedrock, Google Cloud and other platform-specific routes can have different processing conditions. A model page saying an endpoint exists is not evidence that a particular tenant is allowed to use it, or that a signed DPA, enabled ZDR, customer region or partner-specific price is in place. Claude Sonnet 4.5's scheduled 2026-11-30 retirement is not an observed shutdown on 2026-10-14. All eight records remain public-source reviews only and `release_eligible=false`; the separate supplier-freshness, customer-contract, Required CI, CodeQL, protected merge and deployed readback are not waived.


## Four further Mistral OCR and Voxtral public model reviews (2026-10-14)

Four official Mistral per-model pages were read, with **model ID, modality-specific pricing units, lifecycle and weight licenses kept separate**. In particular, the Voxtral TTS supplier page explicitly advertises **CC BY-NC 4.0**, which cannot be assumed to authorize commercial self-hosting. This public-model source check is **not a customer license approval**.

| Catalog model | Official model page | Official API code | Public supplier model facts |
| --- | --- | --- | --- |
| `mistral-ocr-4.0` | https://docs.mistral.ai/models/ocr-4-0 | `mistral-ocr-4-0` | Deprecated 2026-09-29, replaced by OCR 4.1; /v1/ocr, structured annotations and batch |
| `voxtral-mini-transcribe-realtime` | https://docs.mistral.ai/models/voxtral-mini-transcribe-realtime-26-02 | `voxtral-mini-transcribe-realtime-2602` | GA, Apache-2.0, live transcription /v1/audio/transcriptions, published $0.006/min |
| `voxtral-tts` | https://docs.mistral.ai/models/voxtral-tts-26-03 | `voxtral-mini-tts-2603` | GA, **CC BY-NC 4.0** weight license (noncommercial), 9 languages, zero-shot voice cloning; $0 input/$16 output per million characters; /v1/audio/speech |
| `voxtral-small` | https://docs.mistral.ai/models/voxtral-small-25-07 | `voxtral-small-2507` | GA, Apache-2.0, audio input, 32K context, audio $0.004/min, text $0.10 input/$0.40 output per million tokens |

Every entry retains `release_eligible=false`; tenant account access, executed commercial licensing, actual bill, regional processing and retention remain unverified. Model family names are not automatically valid API identifiers. Existing supplier freshness / governance / CI / protected merge controls remain untouched.


## Seven Google Gemini exact-model pages: lifecycle and capabilities (2026-10-14)

Official per-model developer documentation inspected, with exact model ID, API state (Stable/Preview/Deprecated), supported modalities and token limits. Model-page publication does not establish the account's API entitlement, EEA/UK terms, model billing tier or an enabled data-retention control.

| Catalog model | Official Google model URL | Model-specific supplier observation |
| --- | --- | --- |
| `gemini-2.5-flash-lite` | https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite | Stable but access restricted to existing active users, not deprecated; 1,048,576 input/65,536 output; multimodal in/text out |
| `gemini-3.1-pro-preview` | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview | Preview, 1,048,576 input/65,536 output, multimodal in/text out and function calling |
| `gemini-3.1-flash-lite` | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite | Stable, 1,048,576 input/65,536 output, multimodal in/text out, Batch/Flex/Priority supported |
| `gemini-3.8-flash` | https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash | Stable, 1,048,576 input/65,536 output, multimodal in/text out, preview computer-use capability |
| `gemini-3.7-flash` | https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash | Deprecated; API routes automatically to gemini-3.8-flash, not an active unmodified backend |
| `gemini-3-flash-preview` | https://ai.google.dev/gemini-api/docs/models/gemini-3-flash-preview | Preview model code, multimodal in/text out, 1,048,576 input/65,536 output |
| `gemini-3.5-flash` | https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash | Deprecated; automatically routed to gemini-3.6-flash |

Important distinctions: `gemini-2.5-flash-lite` remains listed as **not deprecated**, yet API access for newly created accounts is restricted; `gemini-3.7-flash` is deprecated and aliases 3.8 Flash; `gemini-3.5-flash` is deprecated and aliases 3.6 Flash. Do not certify these as independent active backends. All seven public model-page reviews are `release_eligible=false`, and pricing/tenant governance remain separately unverified until provider- and customer-specific checks are complete.


## Eight Gemini image, live and speech model-owner page reviews (2026-10-14)

Eight official Google model-specific documentation pages were checked for API IDs and distinct image, speech/transcription and Live preview modalities. Prices for image rendering or live audio sessions are **not equivalent** to generic text-token prices, and API model aliases are not proof of customer access.

| Catalog model | Official Google per-model page | Observed model-specific capability |
| --- | --- | --- |
| `gemini-3-pro-image` | https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image | Stable image generation/editing; image/text input and output; 65,536 input and 32,768 output token limits |
| `gemini-3.1-flash-image` | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image | Stable Nano Banana 2 image generation/editing; text/image/video/PDF input, image/text output, 131,072 input/32,768 output |
| `gemini-3.1-flash-lite-image` | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite-image | Dedicated image generation model listing; verify per-image pricing separately |
| `gemini-3.1-flash-live-preview` | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-live-preview | Live multimodal realtime preview model code, not interchangeable with ordinary text-only generateContent |
| `gemini-3.1-flash-tts-preview` | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-tts-preview | Text-to-speech preview model; spoken audio output, not generic text pricing |
| `gemini-3.5-flash-lite` | https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite | Flash-Lite model code and current lifecycle shown in Google's model-specific page |
| `gemini-3.5-live-translate-preview` | https://ai.google.dev/gemini-api/docs/models/gemini-3.5-live-translate-preview | Preview live translation and audio modality; provider-priced duration not generic per-text token rate |
| `gemini-3.5-transcribe` | https://ai.google.dev/gemini-api/docs/models/gemini-3.5-transcribe | Dedicated transcription model; audio-input semantics and available endpoints from model page |

No commercial contract, actual billed image/audio usage, account model activation, tenant storage region or ZDR enabled status was inspected. These are eight public-source reviews with `release_eligible=false`; independently reviewed supplier claims and protected production release are separate gates.


## Twelve OpenAI exact model-owner documentation reviews (2026-10-14)

Exact model-specific OpenAI developer pages were inspected for supplier-listed model ID, features and intended API endpoint. Price basis differs across text, live audio, transcription, translation and moderation products; do not transpose USD per-token rates to USD per audio minute or a customer-specific invoice.

| Catalog ID | Official OpenAI model-specific source | Public supplier product purpose |
| --- | --- | --- |
| `gpt-6-astra` | https://developers.openai.com/api/docs/models/gpt-6-astra | GPT-6 Astra model, documented context and pricing; regional and fast mode options have distinct eligibility |
| `gpt-6-luna` | https://developers.openai.com/api/docs/models/gpt-6-luna | GPT-6 Luna model listing and API routes; tenant access and contract untested |
| `gpt-6-sol` | https://developers.openai.com/api/docs/models/gpt-6-sol | GPT-6 Sol model listing, pricing and token limits; tenant route untested |
| `gpt-6.1-sol` | https://developers.openai.com/api/docs/models/gpt-6.1-sol | GPT-6.1 Sol newer model listing and supported Responses route |
| `gpt-audio-1.5` | https://developers.openai.com/api/docs/models/gpt-audio-1.5 | GPT Audio 1.5 audio input/output modality, not generic text-model tariff |
| `gpt-live-1` | https://developers.openai.com/api/docs/models/gpt-live-1 | GPT-Live 1 low-latency voice model and native live audio session |
| `gpt-live-transcribe` | https://developers.openai.com/api/docs/models/gpt-live-transcribe | Live transcription audio-input model; availability separate from voice conversation model |
| `gpt-realtime-2.1` | https://developers.openai.com/api/docs/models/gpt-realtime-2.1 | Realtime 2.1 audio-first streaming model with endpoint-specific modality limitations |
| `gpt-realtime-2.1-mini` | https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini | Realtime 2.1 mini variant; streaming audio endpoint |
| `gpt-realtime-translate` | https://developers.openai.com/api/docs/models/gpt-realtime-translate | Realtime translation model for live speech language conversion |
| `gpt-realtime-whisper` | https://developers.openai.com/api/docs/models/gpt-realtime-whisper | Realtime Whisper model for speech transcription rather than full text dialogue |
| `omni-moderation-latest` | https://developers.openai.com/api/docs/models/omni-moderation-latest | OpenAI omni-moderation family classification model; moderation endpoint not arbitrary text-generation API |

For each, a public source page is proof of documented product identity, **not** of enabled organization entitlement, region-specific processing, signed DPA, zero retention or actual customer endpoint configuration. Any alias or public price requires exact modality, tier and usage-quantity qualification. The supplemental review records are marked `customer_verified=false`, `release_eligible=false` and do not bypass protected model claim freshness or tenant acceptance.


## Seven regional AWS Bedrock model-owner documentation checks (2026-10-14)

Seven public AWS-owned model cards / AWS official legacy lifecycle tables were independently read for exact model identity, modality, lifecycle and regional availability claims. AWS explicitly says `modelLifecycle` is authoritative for a given region/account; a model can have different lifecycle statuses by region. Historical EOL dates or a surviving webpage alone are not tenant entitlements. The AWS Premier public card contradicts its own dates and must remain `CONFLICT` until authenticated region-scoped readback.

| Catalog model | AWS official model or lifecycle documentation | Scope-bound public observation |
| --- | --- | --- |
| `amazon-nova-canvas` | https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-canvas.html | Amazon Nova Canvas image generation; bedrock-runtime Invoke; EOL 2026-09-30 in specifically listed three regions; model card Legacy label conflicts with elapsed date |
| `amazon-nova-lite` | https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-lite.html | Amazon Nova Lite 300K context and 10K output; card says Active; per-account regional eligibility not inferred |
| `amazon-nova-multimodal-embeddings` | https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-amazon-nova-multimodal-embeddings.html | Nova 2 Multimodal Embeddings hosted in Bedrock, model and region-specific invocation; no generic token tariff |
| `amazon-nova-premier` | https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-premier.html | AWS Nova Premier card contradicts itself: EOL no sooner 2026-10-31 vs EOL 2026-09-14 and Legacy label; tenant-region AWS modelLifecycle readback required |
| `amazon-nova-reel` | https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-reel.html | Amazon Nova Reel video generation; EOL 2026-09-30 in listed AWS regions; do not infer global retirement |
| `amazon-nova-sonic` | https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-sonic.html | Amazon Nova Sonic realtime speech-to-speech; model amazon.nova-sonic-v1:0 EOL 2026-09-14 in listed regions; InvokeModelWithBidirectionalStream |
| `amazon-titan-multimodal-embeddings-g1` | https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-titan-multimodal-embeddings-g1.html | Amazon Titan Multimodal Embeddings G1 for text and image embedding, via AWS Bedrock runtime; current regional price/eligibility account-dependent |

The official AWS lifecycle listing https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle-legacy.html provides region-qualified removals and directs consumers to `GetFoundationModel`/`ListFoundationModels`; these are not callable using public sources alone. No customer AWS credentials were read, no contracts asserted, no provider `CONFLICT` overwritten, and every public source review remains `release_eligible=false`. Pricing and approved tenant retention require separate evidence.


## Three Cohere exact-model public source checks (2026-10-14)

Three Cohere official product/model guides independently inspected. API model identifiers and rate-limited API access must not be confused with a commercial Model Vault SKU, executed customer contract or actual rate. In particular, a free trial/production key within rate limits is not an unlimited free enterprise production commitment.

| Catalog model | Official Cohere source | Public facts and pricing caveat |
| --- | --- | --- |
| `command-a-plus-05-2026` | https://docs.cohere.com/docs/command-a-plus | Model ID command-a-plus-05-2026; 128K input /64K output, multilingual 48 languages, free API access within limits, paid enterprise Model Vault separate; Apache-2.0 downloadable weights |
| `command-a-reasoning-08-2025` | https://docs.cohere.com/docs/command-a-reasoning | Model ID command-a-reasoning-08-2025; 256K context/32K output, Chat V2, free key use within rate limits, Model Vault separate |
| `embed-multilingual-v3.0` | https://docs.cohere.com/docs/cohere-embed | Embed Multilingual v3.0 is a distinct embedding-family ID; model documentation lists multilingual text embeddings; no reliable per-model current dollar rate inferred from an older Vault instance price |

No claim of customer-governance enablement, provider account credentials, agreed Model Vault billing, region, or full source acceptance has been made. Review metadata remains `release_eligible=false`; incomplete tariff fields remain explicitly unverified rather than filled by guesses.


## Six remaining Gemini model-specific developer page reviews (2026-10-14)

Six Google-owned exact model documentation pages were inspected for model codes, documented audio/video output modality, and API scope. In particular, the canonical Gemini Omni Flash page is `/models/gemini-omni-flash`, but its **API code is `gemini-omni-1.1-flash`**; a nonexistent URL made directly from the model ID is not proof of an absent model. Google's Gemini Omni 1.1 is for video generation/editing via Interactions and **not** a generic text completion.

| Catalog model | Official Google page | Specific public model fact |
| --- | --- | --- |
| `gemini-3.6-flash` | https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash | Stable 1,048,576 input/65,536 output token multimodal text-generation model, model code exact |
| `gemini-3.8-flash-lite-tts` | https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-lite-tts | High-throughput TTS, 101 languages, suggested migration from Gemini 3.1 Flash TTS preview; schema WAV default differs from old PCM |
| `gemini-3.8-flash-tts` | https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-tts | Higher-fidelity TTS, 130 languages, different usage/cost basis from Flash-Lite TTS |
| `gemini-3.8-live` | https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live | Native live multimodal conversation model; not the ordinary Flash text endpoint |
| `gemini-3.8-live-extended-thinking` | https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live-extended-thinking | Realtime Live Extended Thinking variant; reasoning and multimodal session applicability depends on endpoint |
| `gemini-omni-1.1-flash` | https://ai.google.dev/gemini-api/docs/models/gemini-omni-flash | Stable Gemini Omni Flash 1.1 video generation/editing and extension with native audio; official model code gemini-omni-1.1-flash (page URL is not model code), Interactions API |

Published model availability, preview or stable labels do not prove account activation, regional entitlement or customer retention controls. Distinct audio/video usage tariffs are not inferable from ordinary Gemini text-token pricing. No customer data or contract was accessed; each `independent_model_source_review_20261014` is `release_eligible=false`.


## Final six supplier-model source checks: Mistral and xAI (2026-10-14)

The remaining six supplier-specific model owner pages have been individually inspected for exact API ID, specialized inference endpoint and published modality-specific price. **The catalog's friendly alias may not be identical to the supplier API code**. A public price is not a guaranteed tenant bill, and a free moderation listing cannot be translated to unbounded entitlement.

| Model | Official supplier source | Documented public supplier fact |
| --- | --- | --- |
| `codestral-embed` | https://docs.mistral.ai/models/codestral-embed-25-05 | GA model code codestral-embed-2505, 8K context, $0.15 per million embedding input tokens and /v1/embeddings; public guide may document codestral-embed alias |
| `mistral-embed` | https://docs.mistral.ai/models/mistral-embed-23-12 | Mistral Embed model code mistral-embed-2312, 8K context, $0.10 per million input tokens, /v1/embeddings |
| `mistral-medium-3-5` | https://docs.mistral.ai/models/mistral-medium-3-5-26-04 | GA v26.04 canonical model code mistral-medium-3-5, Modified MIT weights, 256K context, $1.50 input / $7.50 output per million |
| `mistral-moderation-2` | https://docs.mistral.ai/models/mistral-moderation-26-03 | GA v26.03 canonical code mistral-moderation-2603, 128K context, supplier labels moderation API Free; not unlimited commercial service entitlement |
| `voxtral-mini-transcribe-2` | https://docs.mistral.ai/models/voxtral-mini-transcribe-26-02 | GA v26.02 canonical API model code voxtral-mini-2602, transcription-only $0.003/min /v1/audio/transcriptions |
| `grok-imagine-image-2.0` | https://docs.x.ai/developers/models/grok-imagine-image-2.0 | xAI image generation model $0.04 base image (1K Low), additional input image $0.01; 1.5K, 2K and higher quality higher charges; US regions shown |

These six public source observations are stored with `classification=INDEPENDENT_PUBLIC_MODEL_PAGE_REVIEW_ONLY`, `customer_verified=false` and `release_eligible=false`. Do not treat a complete public-source review matrix as full independent acceptance of all six claims per model. Protected Required, CodeQL, supplier-claim integrity, AWS runtime/region, customer contract and exact production readback remain separate mandatory gates.

## Remaining Cohere canonical API IDs — verified public sources 2026-10-14

The provider API-ID mapping is now present for all seven Cohere catalog records. Added `embed-v4.0` for catalog alias `embed-4`; `embed-multilingual-v3.0` for that named record; and `command-a-reasoning-08-2025` for Command A Reasoning. Official [Embed](https://docs.cohere.com/docs/cohere-embed) and [Command A Reasoning](https://docs.cohere.com/docs/command-a-reasoning) pages are the scoped public sources. Command A Reasoning publicly specifies 256,000 context tokens, 32,000 maximum output tokens and image input.

No missing per-token model price, customer data retention configuration, regional deployment or DPA is inferred. The seven model records remain fail-closed (`supplier_audit.automatic_recommendation_eligible=false`) unless the independent audit and actual tenant evidence have passed. This mapping adds an explicit API identity field; it does not prove runtime connectivity to Cohere. Regressions are asserted in `tests/brain-ai-model-catalog-evidence-recovery.test.mjs`.


## All 110 public model-source pages reconciled; release gate still closed (2026-10-14)

All **110 of 110** catalog rows now have an independently scoped **public model-source review** persisted in Supabase `catalog_record.independent_model_source_review_20261014`, with official supplier URL, model-specific location, an observed public fact, check date and the following explicit limits on **every** row:

- `classification=INDEPENDENT_PUBLIC_MODEL_PAGE_REVIEW_ONLY`
- `customer_verified=false`, `provider_account_verified=false`, `contract_verified=false`
- `all_six_supplier_claims_independently_certified=false`, `release_eligible=false`

A separate readback counted exactly **110 source reviews** and **110 release_eligible=false** markers. These are supplier *model-page discovery/evidence* accomplishments; they are NOT 660 independently approved six-claim supplier attestation outcomes and are NOT 110 customer-accepted models.

The live database at the subsequent check (same day) reported **10 `VERIFIED`, 99 `PARTIAL`, 1 `CONFLICT`**. These row statuses can change under concurrent writers. The ten `VERIFIED` rows still showed `supplier_audit.automatic_recommendation_eligible=false`, legacy quality-audit `all_six_claims_verified=false`, and `public-review.release_eligible=false`. Two gpt-oss rows additionally had a historical `verification_consistency_hold_20261014.verified_safely=false` marker. Reconcile the claim-specific independent supplier acceptance lineage and stale-quality metadata before treating those rows as fully **production** accepted. Do not erase original evidence or automatically demote/promote rows based only on outdated audits.

Protected Required workflow for PR #4368 at source SHA `6f479c32ea5e6177ebaaca1be282a4741141589c`: [run 38617721385](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/38617721385) **failed preflight** in `tests/ai-model-intelligence-freshness-v1.test.mjs`, reporting **60/110 models** failing full supplier-freshness evidence requirements. Earlier source receipts and full-page reviews do not satisfy this substantive test by themselves. The corresponding CodeQL Python/JS jobs succeeded. Further commits require their own exact-head CI readback; a previous commit's CodeQL success is not current-head production approval.

The one unresolved `CONFLICT` is `amazon-nova-premier`: official AWS [model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-premier.html) presents mutually incompatible lifecycle labels/dates while the [Bedrock lifecycle table](https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle-legacy.html) lists region-specific 2026-09-14 EOL. Only an authorized region/account `GetFoundationModel`/`ListFoundationModels` modelLifecycle readback can close the account-specific interpretation. Do **not** mark it accepted based only on a public webpage.

**Blocking finish condition:** independently validated model-specific six-claim supplier facts with no conflicts; fresh and internally consistent attestation/audit metadata; protected Required/CodeQL success on exact head; protected merge; deploy and matching immutable production readback. Customer DPA, signed contracts and enabled tenant provider settings remain a separate authenticated acceptance boundary, never simulated from public docs.

### Official Google image-model deprecation date source correction

The [official Google changelog](https://ai.google.dev/gemini-api/docs/changelog) announces deprecation of `gemini-3.1-flash-image` on **2026-10-06**, recommends `gemini-nano-banana-2.1`, and lists no shutdown date. The catalog mistakenly cited October 8 (the date of separate Gemini 3.5/3.7 Flash deprecations). This correction repairs source locators/observed dates, preserves the existing supplier-only scope, does not certify tenant settings, and adds a regression test. Independent protected CI, merge and production readback remain mandatory.

## Nova Premier official API-ID preservation — 2026-10-14

Official [AWS Bedrock model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-premier.html) documents `amazon.nova-premier-v1:0` for `bedrock-runtime`. Added the ID as `provider_api_id` in the 110-record GitHub catalog and used a conditional Supabase write with database readback. The separate AWS EOL/Legacy policy inconsistency remains `CONFLICT` and production-ineligible. The actual customer and regional lifecycle still requires authorized AWS `GetFoundationModel` modelLifecycle evidence. Public source content must never be treated as authenticated AWS account availability or production release approval.

## Model-page content readback for all 110 records — 2026-10-14

Source evidence is retained in Supabase `public.ai_model_supplier_verification_v1`. All 110 records have a dated model-page content-review entry under one of `official_model_page_content_audit_20261014`, `independent_model_page_title_audit_20261014`, `independent_exact_model_id_review_20261014` or `independent_model_page_content_audit_20261014`. The public source checks **DO NOT** approve all six mandatory supplier claims, attest authenticated tenant availability, or authorize release.

A 72-URL retrieval check returned 71 successful fetches and one denied automated fetch for Google's public model index. Google endpoint IDs were checked separately against its official public model-listing webpage. Content-level observations include 13 AWS model cards (10 exact Bedrock IDs extracted, Titan Image Generator G1 v2 confirmed on the public web, Nova Premier and original Nova Sonic page redirects requiring a separate lifecycle check), 22 Mistral records (model titles observed; exact API ID is not always present in a basic page scrape), seven Cohere records (the Command A+ display-name and versioned ID share a canonical model), five xAI records, 20 OpenAI records, 11 Anthropic records, 21 Google records, seven TII/Falcon repositories, two DeepSeek model listings and exact Meta/Qwen open-weight repositories.

The attempted standalone file `data/ai-model-supplier-source-content-audit-20261014.json` was committed at `8cd1b19756b167480124c4c843809510b4534548`, but the protected hygiene/admission check correctly rejected it as an unclassified delivery path. That file was removed by commit `7e0e14428521edf8a377478c6a7ea7649cc3874a`. The original supplier-review records remain stored in Supabase; this existing delivery-scoped change document is the GitHub summary.

Release conditions are unchanged: 110/110 independently reviewable and accepted model-level evidence, resolved material lifecycle/identity conflicts (including an authorized account+region AWS lifecycle readback where required), green Required and CodeQL on the exact candidate SHA, protected merge and immutable production readback. Never infer production acceptance from document reachability, populated evidence fields or a mutable database `VERIFIED` label alone.
