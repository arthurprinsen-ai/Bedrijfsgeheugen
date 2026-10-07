# Powerhouse Source Universe & Impact Engine

Use this skill for any Bedrijfsgeheugen task that adds, changes, consumes, scores or presents external or internal intelligence.

## Canonical lineage

`source capability → observed evidence → canonical external signal → tenant company impact → recommendation → canonical Brain obligation → verified outcome → existing compound learning`

Never introduce a parallel source store, crawler authority, scheduler, CRM, task queue, outcome ledger or learning store when the existing Powerhouse authority can be extended.

## Truth boundaries

1. **Catalog ≠ connected.** A source catalog row says Bedrijfsgeheugen knows the source and intended use. Only current provider/evidence observations can justify `CONNECTED`, `OBSERVED` or `LIVE`.
2. **Available ≠ live.** A public URL/API can be available without any recent observation.
3. **Signal ≠ company impact.** The external signal projection is canonical/global. Tenant impact is stored separately and references that signal.
4. **Signal score ≠ impact score.** Generic relevance ranks external evidence. Company impact requires probability, magnitude and exposure.
5. **Money is evidence-only.** Expected value/loss remain `NULL` without company evidence.
6. **Unknown stays unknown.** Missing company context is not zero and never turns GREEN.
7. **Raw and derived remain separate.** Raw observations stay in existing evidence/source authorities; classifications, scores and recommendations are projections.
8. **Execution remains canonical.** Only READY, evidence-backed tenant actions can materialize into `brain_obligations`.
9. **Fulfilled ≠ outcome.** A fulfilled obligation is not business value. An intelligence action becomes DONE only when verified `powerhouse_outcome_memory_v1` evidence is linked.
10. **One scheduler.** Reuse `powerhouse_runtime_scheduler_mux_v3`; never add a second cron writer for this loop.
11. **Closed-loop assurance.** `external-intelligence-universe` requires input, decision, action, readback, outcome, measurement, learning and guard. Missing downstream evidence keeps the loop non-GREEN.

## Domain universe

External (35): regulation, cyber, AI/technology, competition, customer/market behaviour, macro-economy, finance/capital, subsidies/tax, labour, skills, energy, climate/physical risk, commodities, supply chain/logistics, geopolitics, international trade, sustainability/ESG, demography, socio-cultural change, media/news, social communities, search/internet demand, pricing, real estate/location, mobility, public procurement, business registers, M&A/investment, patents/IP, standards, reputation/trust, insurance, fraud/financial crime, health/disruption and local environment.

Internal (10): finance/cashflow, customers/sales, people/HR, operations, projects/delivery, systems/data, documents/knowledge, suppliers/procurement, marketing/digital and service/quality.

## Runtime authorities

- taxonomy: `public.powerhouse_intelligence_domain_registry_v1`
- source capability/status: `public.powerhouse_intelligence_source_catalog_v1`
- raw external signals: `public.bg_externe_signalen`
- evidence: `public.powerhouse_evidence_source_observations`
- canonical signal projection: `public.powerhouse_intelligence_signal_projection_v1`
- tenant impact: `public.powerhouse_intelligence_company_impact_v1`
- action candidates: `public.powerhouse_intelligence_action_candidate_v1`
- Portal read model: `public.powerhouse_intelligence_snapshot_v1`
- impact write: `public.powerhouse_upsert_intelligence_company_impact_v1(...)`
- canonical action promotion: `public.powerhouse_materialize_intelligence_action_v1(text,text)`
- outcome reconcile: `public.powerhouse_reconcile_intelligence_outcomes_v1(text)`
- refresh: `public.powerhouse_refresh_external_intelligence_universe_v1(text,integer)`
- scheduler: `public.powerhouse_runtime_scheduler_mux_v3(timestamptz)`
- Loop Assurance: `external-intelligence-universe`
- Portal: `https://www.bedrijfsgeheugen.nl/portal-v2/?page=omgevingsradar`

## Portal contract

Portal V2 uses **Omgevingsradar** as the overview while retaining specialist pages. It must show source availability state, full domain coverage, ranked observed signals, tenant-specific impact state, evidence-backed monetary values only, action candidates and scope/provenance. Links in generated HTML must use full absolute URLs.

## Security

All intelligence projection tables are server-only:
- RLS enabled;
- no table grants for `public`, `anon` or `authenticated`;
- explicit service-role grants only;
- SECURITY DEFINER helper functions revoke browser execution;
- Portal data is read through the authenticated Netlify server function with tenant scoping.

## Production proof

Do not claim LIVE from source or CI. Required: protected merge → Supabase migration/readback → canonical refresh evidence → Netlify exact-main deploy/readback → authenticated Portal/API verification → Loop Assurance evidence. Only then promote the System Map capability from `CANDIDATE_PROTECTED_DELIVERY`.

## Internal evidence and signal relations

- Internal signals may only be projected from a source observation whose evidence explicitly resolves to the same tenant (`tenant_id`, `organisatie_id` or the same key inside `scope`). If that identity is absent or different, fail closed with `TENANT_SOURCE_OBSERVATION_SCOPE_REQUIRED`.
- Relation generation may automatically create only `SHARED_DOMAIN` and `COMPANY_DEPENDENCY` relations from bounded evidence.
- **Correlation is not causality.** Automatic relation logic must keep `causality_claimed=false`; a `CAUSAL_HYPOTHESIS` needs separate explicit evidence and may not be inferred from co-occurrence, timing, shared domain or shared company exposure alone.
