# Powerhouse Source Universe & Impact Engine

INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1

## Verplichte cross-agent preflight en nieuwe release-readback (29 oktober 2026)

Iedere agent die dit domein gebruikt moet de router in `AGENTS.md`, dit bestand, bestaande `brain/learning/2026-10-29-tavily-plan-limit-canonical-fallback.json` en de **actuele** bron- en ONE BRAIN-evidence opnieuw lezen. De beschermde PR **#5133** is op `main` gemerged als `14ced18b5876fadc4e111d42f6bbac7cdb293b5a`: source-skill, Brain-leerrecord, menselijke documentatie en regressietest zijn via onafhankelijke GitHub-main-readback bewezen. Dit was een **governance/learning** release; het is geen Netlify-webrelease en heeft geen nieuwe Edge-implementatie veroorzaakt. Bij de laatste productielezing was `bg-externe-signalen` v26 ACTIVE met afzonderlijk bevestigde 40101-no-retry. Lees **altijd** de huidige versie opnieuw in plaats van v24/v26 permanent te veronderstellen.

Voor elke overdracht: bestaande fingerprint `powerhouse|external-search|tavily-plan-limit-432|20261029`, de oudere 2/3- en 40101-incidentdata, de daadwerkelijke operatorbatch 15935 en alle nog ontbrekende natuurlijke/Bedrijfsoverdracht-bewijzen in één idempotente bestaande Brain/Powerhouse-lineage. Laat bewijsstatus per scope onveranderd totdat onafhankelijke provider-ID + bronwaarneming + Brain-readback de volgende overgang rechtvaardigen; geen extra paid retry om status GREEN te forceren.

## Tavily limiet en fallback — 29 oktober 2026
- Bestaande Edge-functies die via protected-main release worden gewijzigd moeten in `supabase/config.toml` geregistreerd zijn; de releaseautoriteit moet exacte bron en providerversie teruglezen. `bg-externe-signalen` gebruikt `verify_jwt=false` uitsluitend samen met zijn eigen gecontroleerde `x-powerhouse-token`.
- Fingerprint: `powerhouse|external-search|tavily-plan-limit-432|20261029`. Registreer in bestaande ONE BRAIN en #4215, inclusief providerbewijs, root cause, vóór/na, tests en readback.
- Gebruik uitsluitend `bg-externe-signalen` binnen `powerhouse_runtime_scheduler_mux_v3`. Op 432: singleflight probe en 15 minuten cooldown per isolate; op 429: 1 minuut cooldown. Gebruik de bestaande geautoriseerde DataForSEO fallback en label `fallback_reason`.
- Een gedeeltelijk geslaagde bronbatch blijft NON-GREEN; geen fictieve signalen, geen nieuwe scheduler/writer, geen gevoelig providerpayload in bewijs, geen omzeiling van Tavily-planlimieten.
- DataForSEO 40101 is a potentially billable search-engine failure after provider-internal retries, NEVER a verified empty SERP. Never immediately resubmit the same paid request; 40102 alone denotes observed no results. Preserve numeric evidence and partial 207 non-GREEN. Incident #4215.
- Serper en Exa zijn via Composio alleen **on demand** geverifieerd. Er is geen bewijs voor Composio-accountrechten of automatische Serper/Exa-failover in Supabase-productie.
- Alleen beschermde merge, echte Supabase-functieversie, source observation, portaalreadback en gemeten effect rechtvaardigen de status LIVE.

## Source batch proof and agent handoff — 29 October 2026 (verified v24)
- **Scope:** The historical 2026-10-29 14:54:23 UTC producer batch was **2/3**, with `Bedrijfsoverdracht` failing DataForSEO task `40101`. Preserve that RED receipt and provider diagnostics; never transform it into 40102, a zero-results observation, or a later GREEN.
- **Actually observed recovery:** Protected #5130 is merged; Supabase provider `bg-externe-signalen` ACTIVE **v24** (source SHA256 `61db948c7079e919f550bb4459f9f80e7868897d56533f230c754befd41f9ff7`). Exactly one operator-triggered request via existing `public.bg_roep_functie`, pg_net **15935**, returned **HTTP 200**, `processed=3`, `successful=3`, `failed=0`, `found=27`, `allowed=5`, `noise=17`. Topics: Concurrentie, Cyberdreigingen, Demografie. Existing DataForSEO organic fallback was used after Tavily 432; this proves fallback for those topics, not the historical Bedrijfsoverdracht topic.
- **Independent readback:** `public.powerhouse_evidence_source_observations` (`external-intelligence`, `producer_run=true`, 2026-10-29T15:12:54.378Z) shows 3/3; `public.brain_delivery_evidence` at 15:12:54.600Z is GREEN for **that batch**. `public.brain_failure_registry` fingerprint `powerhouse|external-search|tavily-plan-limit-432|20261029` is VALIDATED v4; `public.powerhouse_runtime_events` dedupe `external-intelligence:operator-postrelease-15935:v24` holds recovery/remaining-proof details. Evidence: GitHub PR #5130 discussion and issue #4215.
- **Proof states must stay distinct:** `CODE_AND_PROVIDER_LIVE`, `OPERATOR_BATCH_3_OF_3_VERIFIED`, `NATURAL_RUN_PENDING`, `BEDRIJFSOVERDRACHT_PENDING`, `COST_DELTA_UNKNOWN`. Never promote the entire source cadence, original topic, tenant downstream impact, conversion or revenue to GREEN from one manual 3/3 batch.
- **Next canonical observation:** Reuse only existing scheduler mux cron job **171** at **2026-10-30 05:31, 05:51, 06:11 UTC** (Europe/Amsterdam 06:31, 06:51, 07:11). Compare `public.bg_functie_aanroep`, real `net._http_response` status, per-topic `public.powerhouse_evidence_source_observations` and `public.brain_delivery_evidence`. Only a matching natural run closes `NATURAL_RUN_PENDING`; revisit `Bedrijfsoverdracht` at its normal deterministic topic rotation, not a forced paid retry.
- **Self-healing/handoff:** Keep the single scheduler/exclusive producer, existing URL upsert dedupe, bounded 432/429 cooldown and provider-safe 40101 retry exclusion. Persist failures with exact per-topic status, request-ID, evidence, owner, next valid action and regression; propagate the open gates to the next agent. Do not create a second scheduler, publisher, provider account or fake provider receipts.

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
