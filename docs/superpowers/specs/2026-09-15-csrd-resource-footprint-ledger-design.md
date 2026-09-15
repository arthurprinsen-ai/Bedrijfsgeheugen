# CSRD Resource Footprint Ledger — design

Date: 2026-09-15
Status: approved direction / implementation pending
Owner: Powerhouse / Portal V2
Fingerprint: `powerhouse-csrd-resource-footprint-ledger-v1`

## Purpose
Extend the existing Portal V2 `CSRD & Impact` capability. Do not create a parallel ESG/CSRD application. The same canonical Powerhouse data path must show, for both a customer tenant and Bedrijfsgeheugen itself, what resources are consumed, what environmental impact is measured or estimated, how the calculation was made, and what evidence supports it.

The solution must automatically ingest available usage/evidence from existing systems, including Supabase/Powerhouse, GitHub, Notion and AI/provider usage, and must be extensible to other SaaS/cloud providers without introducing Make or a second data authority.

## Architectural decision
Use one canonical resource-usage ledger in Supabase/Powerhouse. Raw activity is immutable input; environmental impact is a derived, versioned projection. Portal V2 reads the projection and evidence metadata. Notion remains human-readable documentation/audit projection, GitHub remains code/config/version authority, and provider APIs/runtime telemetry remain measurement sources.

No resource estimate may be presented as measured fact. Provider-reported/direct measurements take precedence. Estimates always carry methodology, factor version, source/evidence, uncertainty/confidence and calculation timestamp.

## Scopes
Every event/metric belongs to exactly one accountable scope:
- `customer`: resource use attributable to a customer tenant;
- `bedrijfsgeheugen`: Bedrijfsgeheugen's own operational footprint;
- `shared`: shared platform consumption that cannot yet be directly assigned and therefore needs an explicit allocation method.

All records retain `tenant_id` where applicable. Shared cost/impact is never silently assigned to a customer.

## Canonical data model
### `powerhouse_resource_usage_events`
Append-only activity ledger. Core fields:
- id, occurred_at, period_start, period_end
- tenant_id, accountable_scope, environment
- source_system, provider, service, model, operation
- request_id / run_id / workflow_id / commit_sha when available
- input_tokens, output_tokens, cached_tokens, reasoning_tokens when providers expose them
- api_calls, compute_seconds, storage_byte_hours, ingress_bytes, egress_bytes, records_processed, files_processed
- direct_energy_kwh, direct_water_l, direct_co2e_kg when directly reported
- cost_amount, cost_currency when already available from the provider/runtime
- measurement_kind (`measured`, `provider_reported`, `calculated`, `estimated`)
- evidence_uri/evidence_ref, source_payload_hash, provenance
- ingestion_method, ingested_at, data_quality, confidence
- idempotency_key and schema_version

### `powerhouse_impact_factors`
Versioned calculation factors. Fields include:
- factor_id, category, provider/service/model/region applicability
- unit basis and factor value/range
- energy_kwh factor, carbon kgCO2e factor, water litres factor as applicable
- valid_from/valid_to
- source/evidence, publication date, methodology
- uncertainty and confidence
- status (`active`, `superseded`, `blocked`)

No hard-coded AI environmental constant is allowed in UI code.

### `powerhouse_resource_impacts`
Derived auditable impact records:
- source usage event / aggregation key
- tenant/scope/period
- energy_kwh, co2e_kg, water_l and other supported resource metrics
- ESRS mapping
- factor ids/versions
- calculation formula/version
- measurement status
- confidence/uncertainty
- calculated_at and evidence lineage

### `powerhouse_resource_sync_state`
Connector/readback state per source: last successful collection, watermark/cursor, last evidence timestamp, freshness SLO, last error, retry state and next eligible run.

## Sources and automatic collection
Use existing Powerhouse ingestion/runtime patterns and add adapters, not a new integration platform.

Initial source classes:
1. AI/providers: token/request/model usage, where exposed; provider energy/water/carbon data if supplied; otherwise model/provider activity remains raw and impact is estimated only when an approved factor exists.
2. Supabase: database/storage/edge-function/runtime usage that the platform exposes, plus existing Powerhouse AI/run tables and cost/usage telemetry.
3. GitHub: Actions/build minutes, workflow runs, artifacts/storage and deploy-related evidence when available; commit SHA is used for lineage, not as a carbon estimate by itself.
4. Netlify/runtime: builds, functions, bandwidth and deploy activity when exposed by existing telemetry/provider API.
5. Notion: human-readable policies, methodology, evidence links, factor governance and audit projection. Notion is not the measurement authority.
6. Other SaaS/cloud sources already connected to Powerhouse: ingest usage only where a stable provider/runtime source exists.

Collectors must be idempotent, watermark-based, fail-closed for false `measured` claims, and write failures to the existing error/learning lineage.

## Calculation and allocation
Calculation order:
1. Direct measured/provider-reported environmental value, if available.
2. Provider-specific approved factor for the exact service/model/region/date.
3. Approved broader factor with explicit lower confidence.
4. If no defensible factor exists: display the raw activity (for example tokens, requests, GB-hours) and mark environmental impact as `not yet estimable`; never invent precision.

Shared platform usage is allocated only through a versioned rule (for example tenant request share, compute share, storage share or another attributable driver). The allocation method and unallocated remainder are visible.

## CSRD / ESRS mapping
Portal V2 keeps the existing domains and adds auditable resource metrics underneath them:
- ESRS E1 Climate: energy and GHG/CO2e-relevant metrics, with organisational-boundary classification handled explicitly.
- ESRS E3 Water and marine resources: water consumption/withdrawal data where available or defensible estimates with methodology.
- ESRS E5 Resource use and circular economy: relevant hardware/material/e-waste/resource-flow evidence when available.
- Social/Governance remain separate domains; AI usage governance, evidence quality, controls and methodology status are shown there rather than falsely counted as environmental impact.

Regulatory mapping is metadata, not a guarantee that every metric is material or reportable for every tenant. Double-materiality and organisational boundary determine final reporting relevance.

## Portal V2 UX
Extend existing `portal-v2/csrd-impact.js` instead of replacing it.

The page gets two clear views:
- `Mijn organisatie`: customer-attributable footprint and applicable CSRD/ESRS metrics.
- `Bedrijfsgeheugen-platform`: transparent footprint of the Bedrijfsgeheugen service used to operate the tenant, where attributable, plus an explicitly labelled shared/unallocated section.

Core cards:
- CO2e, water, energy and resource/circularity metrics;
- AI activity: input/output/cached/reasoning tokens where available, requests and models/providers;
- cloud/SaaS activity: compute, storage, bandwidth, builds/functions where available;
- measurement coverage: measured vs estimated vs not-estimable;
- data freshness, confidence and evidence completeness;
- trend by day/month/year and per business denominator where configured.

Every displayed environmental number opens its lineage: source -> raw usage -> factor/method -> calculation -> ESRS mapping -> evidence -> last validation.

Customer view hides internal operational secrets but never hides methodology, source class, factor version, confidence or whether a value is measured/estimated.

## Existing source registry integration
`portal-v2/data-sources.js` gains the resource-usage ledger and resource-impact projection as existing source classes. Health is green only when source freshness, idempotency, calculation factor validity and evidence completeness meet the configured threshold.

The current demo snapshot in `portal-v2/csrd-impact.js` remains explicitly demo-only until real tenant data is returned. Production code must never relabel demo values as live.

## API/read model
Expose one tenant-safe read model, conceptually `csrd_resource_snapshot`, containing:
- period and scope
- totals and trends
- raw activity summary
- environmental impact summary
- ESRS mapping
- measured/estimated coverage
- methodology/factor lineage
- source freshness/evidence quality
- open evidence/data gaps

Internal read model includes collector errors, internal source ids, allocation diagnostics and repair obligations.

## Security and tenancy
RLS is mandatory before production exposure. Customer sessions can read only their tenant-safe projection. Internal/service writers use existing controlled service roles. No provider secrets, raw prompt content, private Notion content or GitHub secrets enter customer-facing evidence.

## Automation and closed loop
Collection -> normalize -> dedupe -> validate -> calculate -> aggregate -> CSRD map -> quality gate -> portal projection -> readback -> outcome/learning writeback.

Failures create/reuse existing Powerhouse obligations and error-learning records. Missing provider data lowers coverage/confidence rather than manufacturing a value. Factor expiry triggers a re-calculation obligation. New provider/model usage without a matching factor is visible immediately as raw activity plus an estimation gap.

## Tests / release gates
Before promotion:
- unit tests for normalization, factor selection, calculations and allocation;
- contract tests for read model and customer-safe projection;
- RLS/tenant-isolation tests;
- idempotency and duplicate-ingestion tests;
- measured-vs-estimated truth tests;
- factor expiry/version regression tests;
- Portal V2 rendering/accessibility tests;
- demo-data guard: production cannot claim demo values are live;
- existing Portal V2, baseline, security and BRAIN delivery gates remain mandatory;
- preview readback, exact-SHA promotion through BG169, production readback and material-outcome writeback.

## Definition of done
The capability is `LIVE & BEWEZEN` only when a real usage event from an available source flows through the canonical Supabase ledger, produces either a defensible impact or an explicit `not estimable` state, appears correctly in Portal V2 for the right tenant/scope, exposes lineage/evidence, passes tenancy/security/release gates, and production readback verifies the exact promoted version.
