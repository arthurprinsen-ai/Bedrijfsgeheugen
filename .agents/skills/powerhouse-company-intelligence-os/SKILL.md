---
name: powerhouse-company-intelligence-os
description: Use for every Powerhouse task involving company context, CRM/customer intelligence, relationships, opportunities, next-best-actions, agents, outcomes, learning or cross-domain decision intelligence.
---

# Powerhouse Company Intelligence OS

Fingerprint: `powerhouse|company-intelligence-os|know-decide-act-observe-learn-compound|v1`.

## Canonical model

Powerhouse is the company intelligence and execution layer. CRM is one source among many; it is never the brain.

Mandatory loop:

`Know → Understand → Decide → Act → Observe → Learn → Compound`

Canonical layers:
1. **Company Graph** — typed nodes/edges over canonical people, companies, opportunities, actions and decision lineage.
2. **System of Context** — a current, relevant, confidence-weighted context envelope; never a parallel datastore.
3. **Autonomous Action Layer** — route through the existing Powerhouse action/agent fabric and explicit execution boundaries.
4. **Outcome Memory** — store/retrieve observed results with evidence and provenance.
5. **Compound Intelligence** — outcomes must improve a future prediction, priority, policy or next-best-action.

## Runtime authorities

- Graph nodes: `public.powerhouse_company_graph_nodes_v1`
- Graph edges: `public.powerhouse_company_graph_edges_v1`
- Context: `public.powerhouse_system_of_context_v1`
- Actions: `public.powerhouse_autonomous_action_layer_v1`
- Outcome memory: `public.powerhouse_outcome_memory_v1`
- Compound loop: `public.powerhouse_compound_intelligence_v1`
- Orchestration: `public.powerhouse_run_company_intelligence_os_v1(date)`
- Pure architecture module: `brain/company-intelligence/company-intelligence-os.mjs`
- Contract: `brain/contracts/company-intelligence-os-v1.json`

## Hard rules

- Reuse canonical source tables before adding storage.
- Never create a second CRM, opportunity store, action queue, outcome ledger or learning store.
- Every graph fact and context conclusion retains a canonical reference/evidence lineage.
- Never promote an estimate, forecast or expected value to a realized outcome.
- Human/provider authorization gates stay intact; autonomous means bounded execution under existing policy, not bypassing controls.
- Sensitive-person inference is forbidden.
- A learning is incomplete unless it can alter a subsequent decision or action.
- Material changes inherit `powerhouse-system-map-governance`: update map, docs, learning and tests in the same lineage.

## Terminal production proof

A Company Intelligence OS delivery is terminal only after production readback proves the canonical runtime projections. Migration presence, CI success or a merged PR alone are not sufficient.

Required closure behavior:
- Re-read Company Graph, System of Context, Autonomous Action Layer, Outcome Memory and Compound Intelligence in production.
- After proof, promote the canonical System Map capability to `LIVE_PROVEN_RUNTIME` in the same lineage.
- Persist the proof in learning/prevention and the development ledger.
- Never leave a stale candidate status after production evidence exists.
- Never create a second proof/store/queue to represent the same runtime truth.

Verified baseline on 2026-09-28: 42,217 graph nodes; 25,164 graph edges; 17,328 company contexts; 2,883 action-layer rows; 30 outcome-memory rows; 17,328 compound-intelligence company rows.

## Self-improvement bridge

Verified Company Intelligence outcomes feed `powerhouse-self-improvement-layer`. That layer may recalibrate agents, model-routing candidates, policies, tests and engineering candidates, but must reuse Outcome Memory, existing optimization evidence and protected delivery. It must never create a parallel graph, outcome ledger, learning store or uncontrolled production writer.

## Contextual portal projection

Company Intelligence is visible **where a user decides or acts**, not as a separate dashboard.

Required customer-facing surfaces:
- executive cockpit;
- company/decision cockpit;
- impact/value context;
- next-best-actions;
- monitoring & learning;
- evidence health;
- roadmap/execution.

Portal rule: show the understandable loop `Ziet → Begrijpt → Beslist → Doet → Leert`, with compact graph context and Outcome Memory where evidence exists. Use only tenant-scoped portal/runtime evidence. Do not read globally aggregated Company Intelligence views directly into customer UI until tenant isolation is explicit and production-proven. Missing evidence must render as unknown/empty, never as invented context. Roadmap cards may expose impact/effort/intelligence tags only when those values exist in canonical tenant context; Capability Graph must be connected to decision/action/outcome context rather than shown as an isolated diagram.

## Contextual portal governance

The contextual portal projection is a permanent part of the Company Intelligence OS contract.

Mandatory rules:
- Every new material Company Intelligence capability must declare where it becomes visible in Portal V2 when that context is decision-useful.
- Prefer contextual projection into an existing workflow surface over adding a new dashboard.
- Customer-facing projections must resolve from authenticated tenant-scoped portal/runtime state only.
- Global runtime aggregates may be used for backend intelligence, diagnostics and System Map evidence, but never as an unscoped customer UI source.
- If tenant evidence is absent, render unknown/empty; never backfill with demo, global or synthesized business facts.
- Keep the customer vocabulary understandable: `Wat zien we? → Waarom telt dit? → Wat verwachten we? → Wat doen we? → Wat kwam eruit? → Wat leren we?`.
- Preserve semantic separation between forecast/expected value and observed/realized value.
- Show Outcome Memory only when an executed action and observed outcome have evidence lineage.
- Roadmap, graph, impact, next-best-action, monitoring/learning and evidence surfaces must reuse the same canonical context lineage; no parallel UI truth.
- Material portal projection changes require regression coverage, tenant-isolation evaluation, skill update, learning/prevention update, System Map update, change documentation and development-ledger writeback in the same delivery lineage.

## Contextual intelligence visibility invariant

Any intelligence that can materially change a management decision must be projected into the relevant Portal V2 context rather than existing only in Brain, Supabase, logs or a standalone intelligence page.

Required behavior:
- show the intelligence where the user decides, prioritizes or acts;
- prefer compact visual context over detached technical dashboards;
- reuse canonical tenant-scoped evidence and runtime authorities;
- show uncertainty, provenance and evidence state when applicable;
- never fabricate an insight, forecast, benchmark, scenario or action when evidence is insufficient;
- avoid duplicate widgets: project only the subset relevant to the current decision context;
- connect predictions to actions and outcomes so the user can see not only what may happen, but what Powerhouse recommends doing and what happened afterward.

A material intelligence capability is incomplete until its customer-facing projection is implemented where relevant, tested and documented.

## Daily compound-learning feed

Verified runtime outcomes are now captured daily into the existing Outcome Memory before Self-Improvement runs. The canonical authority is `public.powerhouse_run_daily_compound_learning_v1(date)`; it also resolves eligible commercial-progression forecasts from real observed outcomes. Silence is not a negative outcome, synthetic/test events are excluded, and no second outcome or forecast store may be created.


## Daily Compound Learning inheritance

Fingerprint: `powerhouse|daily-compound-learning|all-nodes-inherit|v1`.

This skill inherits the canonical daily compound-learning contract. Every material chat/agent execution must:
- consume bounded shared context and existing learning before acting;
- preserve one canonical outcome/forecast/learning lineage;
- treat only verified observed evidence as outcome truth;
- never convert silence, transport success, synthetic/test events or forecasts into realized outcomes;
- feed verified outcomes into Company Intelligence, Forecast Calibration and Self-Improvement;
- write material learning/prevention back so the next chat or agent changes its next decision;
- remain discoverable through System Map and canonical skill projection.

Canonical runtime: `public.powerhouse_run_daily_compound_learning_v1(date)`.


## Product-market category projection — Company Brain
Fingerprint: `company-intelligence|company-brain-category-projection|v1`.

Powerhouse projecteert de publieke categorie `Company Brain` als acquisitiesignaal naar dezelfde Company Intelligence OS; er ontstaat geen apart brein of parallelle memory/decision/action-loop. De semantische mapping is:
`Company Brain / knowledge-context → signals → impact → decision → action → observed outcome → learning`.

De publieke hoofdclaim **Een Company Brain is waar Bedrijfsgeheugen begint** beschrijft dus de productarchitectuur: context is een inputlaag, niet de terminale capability. Company-Brain-intentie, CTA-progressie, scanuitkomst, lead/proposal/order en gerealiseerde omzet moeten als één lineage terugstromen naar bestaande evidence, outcome memory en compound learning. Verkeer zonder downstream outcome mag nooit als bewezen commerciële waarde worden opgeslagen.

## Ondernemershomepage na Frisse Blik — verplichte doelgestuurde entry

Fingerprint: `portal|frisse-blik|goal-first-entrepreneur-home|v1`.

De **bestaande V2** toont na inloggen eerst: (1) door de klant gekozen ambitie, (2) alleen daadwerkelijk gekoppelde scan/bedrijfsgegevens, (3) één volgende stap met begrijpelijke reden en (4) link naar het bestaande besluit- of invulscherm. Status van een doelkeuze is niet gelijk aan een bevestigd bedrijfsprofiel.

Canonieke opslag: `portal.business_context.goals` + `primary_goal` via bestaande `portalDomainState.patch/flush`, met tenant state plus Brain BusinessInput ACK. Geen tweede onboarding-state, lokale browser data of nieuw portaal. Bij ontbrekende target: eerst doel meetbaar maken. Alleen onderbouwde Powerhouse-voorstellen met gezonde bronstatus en bronreferenties mogen als zodanig verschijnen; nooit uitvoerings- of ROI-bewijs verzinnen.

Elke toekomstige herbouw van het portaal moet `portal-v2/tests/entrepreneur-home.test.mjs` en de twee-tenant productiecontrole blijven behouden. Source: `docs/changes/portal-entrepreneur-goal-home-20261021-v1.md`. Obligation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4578.

## Eén samenhangende ondernemersreis — acht uitkomsten en bronbewijs

Fingerprint: `portal|eight-outcomes|connected-entrepreneur-journey|v1`. Verplichte source-authority: alleen de ingelogde tenantstate, gecontroleerde scanclaims, Brain BusinessInput ACK, brononderbouwde Powerhouse-voorstellen en bestaande Foresight-historie leveren bedrijfswaarheid. Frisse Blik koppelen mag geen herinvoer van bewaarde antwoorden afdwingen; een onbekend of anoniem claimbewijs vereist een geautoriseerde één-klik koppelbevestiging.

De homepage projecteert scan → doel → bedrijfsgegevens → eerstvolgende besluit/actie → gemeten uitkomst in één ervaring. De bestaande ondernemerscockpit en Winstnavigator zijn bereikbaar vanuit diezelfde ervaring. Alle in de page registry geregistreerde pagina's moeten contextuele uitleg bij het gekozen ondernemersdoel tonen. Mutatie-events en aangedane pagina's zijn *afhankelijkheidskennis*, geen doorberekende euro's; uitsluitend bevestigde Brain-write en onafhankelijke outcomes leveren uitvoerings- of waardeclaims.

Notion en GitHub bevatten beheerde documentatie, broncode en leer-/releaseregistraties; Netlify bewijst welke versie draait; Supabase geeft de canonieke geautoriseerde tenantstaat; Composio en externe bronnen geven alleen klantresultaten via bestaande goedgekeurde connectors en provider-readback. Gebruik hun inhoud nooit als onbewezen directe live klantmetric. Geen parallelle opslag, schaduwkoppelingen, nieuwe scheduler of bypass van tenant/RLS. Live release en twee onafhankelijke echte klantacceptaties zijn afzonderlijke statusvelden.

Regressies: `tests/brain-portal-entrepreneur-goal-home-v1.test.mjs` (importeert de geïntegreerde `portal-v2/tests/entrepreneur-journey.test.mjs`), protected Required, CodeQL, exacte Netlify-SHA, en de bestaande #4215/#4547 acceptatie.

### Nulmeting-scores: ontbrekend is nooit nul
Elke overzichtskaart, inclusief de historische Bedrijfslek-weergave, moet ontbrekende, `null`, lege of witruimte-scores als **onbekend** behandelen. Alleen expliciet aangeleverde `0` mag als gemeten 0/100 verschijnen, mits de eigen tenant-claim en herkomst bevestigd zijn. Bron: `portal-v2/modules/overview.js` en `portal-v2/tests/entrepreneur-journey.test.mjs`. Dit is een regressieregel op de bestaande acht-onderdelen-lineage #4585, geen nieuwe dataautoriteit.

## Frisse Blik receipt-volgorde: v3 én v2 strikt selecteren

Fingerprint `portal|scan-claim|cross-generation-most-recent-valid-receipt|20261021-v2`. Een opgeslagen browserreceipt is nog geen geverifieerde tenantclaim. Als `bg_scan_receipts_v3` en `bg_last_scan_receipt_v2` tegelijkertijd bestaan, vergelijk alle geldige getimestampelde bewijzen en kies de nieuwste, niet het eerste array-item of automatisch v3. Pas voor beide vormrestricties, zeven dagen TTL en future-guard toe. Untimed sessiereferentie blijft uitsluitend fallback; de bestaande geautoriseerde `/api/portal-scans` en expliciete gebruikersactie blijven verplicht. Regressie `portal-v2/tests/scan-claim-receipt-order.test.mjs`. Dit is een correctie aan de bestaande tenant-claim en géén nieuwe bron-/schrijfautoriteit.
