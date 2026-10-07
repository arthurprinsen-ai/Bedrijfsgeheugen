# Powerhouse Source Universe & Impact Engine

Use this skill whenever a task adds, changes, consumes or presents external/internal intelligence for Bedrijfsgeheugen.

## Canonical lineage

`source capability → observed evidence → signal → company impact → recommendation → canonical action → readback → outcome → measurement → learning → guard`

Do not introduce a parallel source store, crawler, scheduler, action authority, CRM or learning store when an existing Powerhouse authority can be extended.

## Truth boundaries

1. **Catalog ≠ connected.** `powerhouse_intelligence_source_catalog_v1` describes what can be observed. A connector/provider is live only with current runtime/evidence.
2. **Signal ≠ impact.** A public event may be relevant without being material to a specific customer.
3. **Signal score ≠ impact score.** Signal score ranks external evidence. Company impact requires company context.
4. **Money is evidence-only.** Keep expected value/loss NULL unless supported by actual company exposure and evidence.
5. **Unknown stays unknown.** Missing context is not zero and is never promoted to GREEN.
6. **Raw and derived remain separate.** Raw observations stay in canonical evidence/source observation authorities; classifications, scores and recommendations are projections.
7. **Execution remains canonical.** Intelligence action candidates do not become a second task system. Material execution must route into the existing Brain/action/obligation authority.
8. **One scheduler.** Reuse `powerhouse_runtime_scheduler_mux_v3` / its canonical cron authority for periodic intelligence refresh.
9. **Closed-loop assurance.** The `external-intelligence-universe` loop is not GREEN until required input, decision, action, readback, outcome, measurement, learning and guard evidence is current.

## Domain universe

External: regulation, cyber, AI/technology, competition, customer/market behaviour, macro-economy, finance/capital, subsidies/tax, labour, skills, energy, climate/physical risk, commodities, supply chain/logistics, geopolitics, international trade, sustainability/ESG, demography, socio-cultural change, media/news, social communities, search/internet demand, pricing, real estate/location, mobility, public procurement, business registers, M&A/investment, patents/IP, standards, reputation/trust, insurance, fraud/financial crime, health/disruption and local environment.

Internal: finance/cashflow, customers/sales, people/HR, operations, projects/delivery, systems/data, documents/knowledge, suppliers/procurement, marketing/digital and service/quality.

## Portal contract

Portal V2 uses **Omgevingsradar** as the overview. Keep existing specialist pages for regulation, labour, subsidies, economy, technology, deadlines and sources. The radar must show:
- scope and freshness;
- all domains;
- source capabilities and whether connection/provider action is required;
- ranked observed signals;
- impact state;
- only evidence-backed monetary values;
- next action candidates;
- canonical vs tenant-specific projection scope.

## Security

All intelligence projection tables are server-only in the public schema:
- RLS enabled;
- no `anon` or `authenticated` table grants;
- SECURITY DEFINER functions revoke PUBLIC/browser execution;
- Netlify authenticated server endpoint reads with service role and tenant scoping.

Current Supabase explicit-grant behavior must be treated fail-closed: new public-schema objects are not assumed reachable unless grants are deliberately declared.
