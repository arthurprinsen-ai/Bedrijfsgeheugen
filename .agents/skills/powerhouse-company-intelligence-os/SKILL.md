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

### Veilige vluchtige Brain-runtime in de ondernemersreis

Fingerprint `portal|eight-outcomes|principal-bound-live-runtime|v1`. De geautoriseerde `/api/brain-operating-loop`-projectie is géén duurzaam `portal.business_context`-antwoord. Bied live runtime uitsluitend aan de **huidige** geauthenticeerde principal aan; bij accountwisseling of logout direct wissen en de frontend opnieuw projecteren zonder identiteit of payload in browser-events. Nooit via `domainState`-data van een vorige gebruiker hergebruiken. Brain-runtime-observatie mag niet als bewijs voor connector-provideracties, Heartbeat-SLA, financiële forecast of gerealiseerde winst gelden. Houd de oorspronkelijke Supabase/Brain-writeautoriteit en tenant/RLS intact. Regressie via `portal-v2/tests/entrepreneur-journey.test.mjs` en root-learning-replay.

## Ondernemersgerichte impactfeedback — kandidaatregel (2026-10-30)

De bestaande UX-agent en Company Intelligence/Portal-agent gebruiken de ontwerp- en bewijsgrenzen in `docs/changes/2026-10-30-entrepreneur-impact-feedback-ux-v1.md` als context voor volgende veilige Portal V2-verbeteringen. Dit is **nog geen bewezen nieuwe skill**: promotie vereist eerst Required/BRAIN/CodeQL, exacte live-readback en latere onafhankelijke gebruikers- of outcome-evaluatie.

- Houd op beslis- en actieplekken dezelfde begrijpelijke keten aan: aanleiding → voorspelde impact → beslissing → uitgevoerde actie → werkelijk bewezen impact → leereffect → volgende stap.
- Hergebruik `portal-v2/operating-system/outcome-feedback.js` als read-only visuele component waar tenant-scope en brongezondheid uit bestaande canonical projections gewaarborgd zijn; voeg geen tweede schrijver of meetbron toe.
- Toon verwachte en gerealiseerde cijfers alleen met passende meeteenheid en bewijs. Een verschil is niet automatisch ROI; een taak of provider-ACK is geen geverifieerde uitkomst.
- Gebruik bestaande consented CRO/UX-bronnen om taakvoltooiing, begrijpelijkheid, tijd tot besluit en aantoonbaar zakelijke waarde te meten; geen verzonnen lift.
- UX-technieken worden pas als nieuwe standaard gepromoveerd na aantoonbaar beter gebruikersresultaat met regressiepreventie, toegankelijke mobiele werking en veilig rollbackpad. Houd ongetoetste ideeën expliciet `CANDIDATE/EVIDENCE_DUE`.

## Strategic Adviser Board Brief · kandidaat 2026-10-30

Fingerprint: `portal|strategic-advisor|consulting-grade-evidence-to-decision|20261030-v1`.
De ondernemer krijgt geen technisch dashboard of ongecontroleerde AI-conclusie maar een strategisch bestuursadvies: diagnose → root cause → expliciete strategische alternatieven inclusief niets doen → verwachte waarde/risico's → beslissing → toegestane actie → onafhankelijke uitkomst → Brain-leereffect. Gedraag je als een kritische bedrijfsadviseur; claim géén relatie met McKinsey/BCG.

Het bestaande `portal-v2/operating-system/strategic-advisor.js` is alleen een read-only projectie van de reeds tenant-scoped Executive Projection, op `executive-cockpit.js` en `operating-system-ui.js`. Het weigert stale/ongefundeerd advies en onbekende ROI; door de ondernemer geautoriseerde acties blijven in de originele Next Best Action/Decision flow. Een onbewezen optie is nooit een doorgerekend alternatief en een voorgestelde euro-impact is nooit gerealiseerde omzet.

Dezelfde UI/UX kwaliteitslat geldt op alle pagina's: maximaal drie keuzes voor de dag, gewone ondernemerstaal, voorspelbare navigatie, keyboard/mobile, uitleg en bron onder een disclosure. Een nieuwe UX- of AI-aanpak wordt alleen de nieuwe standaard na representatieve gebruikers-evaluatie, bewijs van taakverbetering en protected productie-readback. Geen tweede model-store, scheduler of eigen CRM; originele ONE BRAIN/Heartbeat leveren de leerlus. De kandidaat wordt getest in `tests/brain-strategic-advisor-one-loop-20261030.test.mjs`.

## Interactieve strategische navigatie — preventieregel 30-10-2026
Fingerprint `portal|operating-system|nested-page-navigation-unbound|20261030-v1`. In de originele Executive Cockpit moet ook de later door `mountOperatingSystemPage` gerenderde adviesknop naar bestaande `OPERATING_SYSTEM_PAGES` navigeren. Bind slechts één eventdelegatie aan de persistente originele cockpit-host; controleer `host.contains` en de pagina-allowlist en lees de actuele canonieke domainState. Herhaald mounten mag geen extra listener of side effect maken; tests dekken nested buttons, rerenders, tenant-safe state, ongeldige pagina's en losgekoppelde nodes. Gebruik `tests/brain-portal-os-delegated-navigation-20261030.test.mjs`, origineel ONE BRAIN-register en het menselijke runbook `docs/changes/2026-10-30-portal-os-nested-navigation-recovery.md`. Gebruikersimpact pas groen na echte productie/browser readback; commerciële verbetering uitsluitend na geverifieerde onafhankelijke funnel- en CRO-uitkomst, nooit op basis van test- of provider-ACK.

## CMS-editorial versus technische release — 30 oktober 2026
Verifieer twee **onafhankelijke** feiten: (1) beschermd main→Netlify→productiebrowser voor Portal V2; (2) de originele geauthenticeerde CMS-database met per item `draft/published/archived` plus publieke readback. De CMS-data is geen goedkeuringsregister voor software-releases en een geslaagde release publiceert geen CMS-concepten. In de bestaande `/cms.html` wordt de status op basis van één read-only GET berekend; nooit automatisch publiceren, geen parallelle status authority/agent/cron, geen ongeautoriseerde bronrechten. Fingerprint `cms|portal|software-release-vs-editorial-status-confused|20261030-v1`. Root cause en instructies `docs/changes/2026-10-30-cms-portal-publication-evidence-v1.md`; preflight `tests/brain-cms-portal-release-assurance-20261030.test.mjs`. Pas na onafhankelijke publicatiereadback content op `published` en na echte provider-orderreadback commerciële status groen.

## CMS as original strategic content workstream
Always show CMS editorial publication and Content→Traffic→CTA→Lead→Order→Learning as two different evidence scopes. In the existing `/cms.html` and portal Executive Cockpit, source CMS facts only from original authenticated CMS API, not portal browser estimates. Enforce the original `cms-admin` quality, current version, explicit human publication and original `cms_public` ID/version readback. No automation may publish bootstrap drafts on technical release green. The original Heartbeat/Growth/SEO/CRO owners alone may attach real traffic, consented leads and provider-verified payments. Record any event or error in existing ONE BRAIN with fingerprint, cause, recovery, verification, recurrence protection and documentation. Source: `docs/changes/2026-10-30-cms-powerhouse-brain-heartbeat-quality-one-loop-v1.md`; regression `tests/brain-cms-powerhouse-one-loop-20261030.test.mjs`.

## Original 15-lus guard diagnose (30-10-2026)
De bestaande geauthenticeerde `/api/powerhouse-one-loop-assurance` projecteert de oorspronkelijke 15-loop status plus afzonderlijk originele stage=guard receipts als beperkte, geallowliste foutcodes met remediatie. Duid exact aan of `ORIGINAL_GUARD_FAILED`, `STAGE_EVIDENCE_MISSING`, `UNAVAILABLE` en onafhankelijke providerverificatie ontbreekt. Gebruik beide bestaande Portal V2 panels; geef een artspecifiek/kanaleigen herstel in dezelfde Powerhouse–ONE BRAIN–Heartbeat-lineage aan de bestaande uitvoerder door. Geen andere scheduler, geen extra statuswriter, geen statusverkleuring bij een gezonde job alleen. Regression `tests/brain-one-loop-original-guard-diagnostics-20261030.test.mjs`; menselijk runbook `docs/changes/2026-10-30-one-loop-original-guard-diagnosis-v1.md`.

## Correct AMBER recovery ownership 2026-10-31
The original 15-loop readback cannot route all AMBER failures to Outreach. Assign original owner from `loop_key` and `missingStages` before acting: Outreach for its missing action/provider readback; the original Content Closed Loop for missing publication/outcome/measurement/learning; the Data Spine Watchdog for missing source/guard/action/outcome. Keep the original RED guard evidence and original status intact. Never infer delivered email, social post, calibrated prediction, paid order or green status. Apply the immutable 31 Oct regression `tests/brain-amber-original-owner-routing-20261031.test.mjs` and human runbook `docs/changes/2026-10-31-heartbeat-amber-original-owner-routing.md`; log all regressions to existing ONE BRAIN.

## Customer Value Briefing — 2026-11-01 (original portal, evidence-first)
De bestaande Portal V2 Executive Cockpit projecteert uit de **oorspronkelijke** tenant-scoped Next Best Actions één brongezonde, nog te beoordelen verbeteractie. Maak oorzaak, volgende stap, meetlat, nulmeting, eigenaar/toestemming, voorspelling, werkelijk gemeten resultaat en leereffect begrijpelijk. Hergebruik uitsluitend oorspronkelijke read-models; geen nieuwe CRM, schrijver, verzender, planner, datastore of klantactie.
**Verplichte waarheid:** `not_executed`, `execution_completed`, `sent` en provider-ACK zijn geen betaalde orders of bewezen bedrijfswinst. Resultaat vereist exact action-ID, terminale verificatie, gezonde onafhankelijke bron, meeteenheid, KPI, nulmeting en periode. Zelfs dan is gemeten effect zonder causale vergelijking geen door Powerhouse *veroorzaakte* ROI. Leerpas alleen na onafhankelijk leerevidence én volgende beslissing. Geen bron? toon EVIDENCE_DUE en de veilige nulmetingsroute.
Fingerprint: `powerhouse|customer-value|activity-without-verified-customer-business-impact|20261101-v1`. Regression: `tests/brain-customer-value-briefing-20261101.test.mjs`. Runbook: `docs/changes/2026-11-01-customer-value-briefing-v1.md`. Release en klantresultaat zijn pas bewezen na beschermde CI, echte Netlify/tenant-readback, onafhankelijke economische/customer outcome en herhaalde natural-run learning. De oorspronkelijke P0 #4198 blijft eigenaar.

## ONE BRAIN measured-outcome proof consistency — 2 november 2026
Bij elk klantresultaat in de originele `executive-cockpit`, `strategic-advisor` en `outcome-feedback` is dezelfde export `verifiedCustomerOutcome` uit `portal-v2/operating-system/outcome-feedback.js` verplicht. De status `OUTCOME_VERIFIED`, `REALIZED_VERIFIED` of `VERIFIED` bewijst **niet** zelfstandig dat er effect is gemeten. Pas als exact `action_id`, numerieke gerealiseerde waarde (ook 0), geldige eenheid, `metric_id`, `baseline_id`, meetperiode én gezonde onafhankelijke bronverwijzing aanwezig zijn, mag het portaal `Resultaat onafhankelijk bevestigd` tonen. Zonder die combinatie blijft realisatie onbekend, ook als er een echte provider-ACK, `checkout_intent.completed` of leervlag is. Een gratis proefperiode is geen betaalde order. Zelfs een echt gemeten EUR-effect is geen oorzakelijke winst, betaalde omzet of ROI zonder afzonderlijke betalings-/counterfactual-reconciliatie.
Herstel alleen in bestaande tenant-geautoriseerde source projection (geen tweede uitlezing, schrijver, agent, cron of CRM), koppel aan origineel ONE BRAIN-incident #4198 met fingerprint `powerhouse|portal|terminal-outcome-without-metric-shown-as-value|20261102-v1`, historisch regressiebewijs `tests/brain-portal-measured-outcome-proof-unification-20261102.test.mjs`, menselijke runbook `docs/changes/2026-11-02-portal-measured-outcome-proof-unification.md` en append-only ledger. Release pas groen na Required, CodeQL, System Map, protected main, Netlify exact SHA en geauthenticeerde tenantreadback. Geen 100%-garantie zonder opeenvolgende nieuwe productieobservaties; bij regressie heropen dezelfde fingerprint en voorkom nieuwe foutklasse.

## Entrepreneur decision-first projection / November 2026
The customer opens the **original authenticated Portal V2**, not a parallel dashboard. Show first (1) the next permitted management decision with an owner, (2) whether its underlying scan/operating context is currently source-verified, and (3) genuinely source-verified observed outcomes. The existing Executive Cockpit Customer Value Briefing (PR #5247) and the entrepreneur-home read-only three-card projection (PR #5248) are two views over the **same original tenant evidence**; never count both as separate outcomes or bypass customer identity checks. Missing baseline, source, approved action, external proof, payment or causal holdout means UNKNOWN, EVIDENCE_DUE or PROPOSAL—not a zero, order, cash saving or caused ROI. Preserve protected route, billing, original auth and decision permissions.

Every material repeat failure in this presentation, stage/learning or release must be observed idempotently through original `public.brain_observe_failure`, linked to exact GitHub/Netlify/tenant provider readback, root cause, fix, regression, prevention and human runbook. Do not mark successful publish/live on PR creation, CI jobs, Netlify preview or source-only copy. The immutable original 2-Nov source candidate is #5248, with explicit Root PR #5247 integration and original System Map regeneration. If another PR lands first, reconcile source on current main in the **same PR**, not via a second customer runtime or action writer.



## Red Dot 2027 — entrepreneur evidence-to-decision experience (2026-11-02)
- Existing owner: Portal V2 Living Interface #4547, original connector P0 #4215, canonical Company Intelligence OS. Do not create a second advisor, data authority, UI shell, agent executor or scheduler.
- Treat design as a trust and comprehension control: entrepreneur can navigate **choose source → grant specific scope → independently verify true source-to-storage data → understand decision and outcome**. Never present configuration count, sample test, model suggestion or AI-consent request as a customer KPI, real provider readback, verified realized outcome, compliant EU-only route, or Red Dot victory.
- The read-only Portal V2 `red-dot-source-navigator.js` uses only the original authenticated `/api/connectors` scoped list, never browser localStorage or raw business records, and never triggers autonomous source writes. Unknown API result is **unknown**, not zero. AI is not used by the guide without explicit consent.
- Every stage is a keyboard- and screenreader-accessible native button with understandable explanatory copy; 44px targets, responsive 320px, reduced motion, visible focus and no hover-only essential information. Connection creation/reconnect still belongs to original `assets/js/koppelingen/view.js` with separate provider permissions.
- Implement an independently evidenced quality loop: 12+ entrepreneur task tests, source understanding, permission comprehension, at least two isolated authenticated tenants, WCAG 2.2 AA assessment and documented real data source→Portal→Brain/Powerhouse. UX targets are hypotheses until measured; leave award/readiness and real-data statuses EVIDENCE_DUE. Compare official Red Dot Brands & Communication Design entry criteria before any claim/submission.
- Regression `tests/brain-red-dot-source-navigator-20261102.test.mjs`; original ONE BRAIN learning and human change/incident ledger only. Protected exact-SHA Required/CodeQL/BRAIN, regenerated System Map, merge, Netlify published commit and authenticated DOM/tenant readback required for live claim.


## 2026-11-05 — ONE BRAIN/Heartbeat owner-waarheid gaat vóór generieke BI-agentroute

INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1
Voor `OPERATIONS_ASSURANCE` is uitsluitend `public.powerhouse_loop_assurance_registry_v1.evidence_contract.recovery_owner,recovery_action` samen met de oorspronkelijke `brain_obligations`, status en stage-receipts leidend. De bestaande 14-agent team roster is een **samenwerkend advies- en specialistenregister**; het creëert géén vervangende eigenaar voor een specifieke runtime-verplichting. Lees actualiteit/tenant/provider-ID, vergelijk exact geregistreerde owner en action, laat original specialist veilig herstel voorbereiden. Bij conflict blijft de status OPEN en moet de oorspronkelijke ONE BRAIN-reconciliation-owner de bron herstellen; geen generieke `Powerhouse` eigenaar of fallback-claim.

Leer en optimaliseer alleen bij echte bron → hypothese → goedgekeurde exclusieve specialistactie → provider-readback → gemeten consequentie → historische baseline → volgende oorspronkelijke keuze. Externe informatie, GA4, GSC, Windsor, DataForSEO zijn signalen, geen onafhankelijk bewijs van order, causaliteit of omzet. De 2026-11-05 bronrun bewees 15/15 eigenaars en routes maar nog 8/3/4 lussen en 23 blockers: geen autonome succesclaim. Registreer de bewijsbare volgende stap in SAME ONE BRAIN en exposeer via het bestaande admin-only Portaal. Test `tests/brain-one-loop-agent-skill-binding-20261105.test.mjs`; nieuw proces, scheduler en dataautoriteit verboden.

## 2026-11-11 — Doorwerking van echte klantvelden in dezelfde Company Graph / Brein-keten (#4215)

De volledige keten is: **invoerveld → centrale tenant-geautoriseerde bronstate → causale getroffen pagina's/berekeningen → canonieke BusinessInput ACK op exacte bronrevisie → verifieerbaar Powerhouse/Heartbeat-advies of actie → onafhankelijk gemeten outcome → bewezen les**. In de UI mogen eerste vier stappen afzonderlijk verschijnen, maar een opgeslagen veld, lokale demo, model-score, simulatie, werkende Playwright, runstatus of Netlify READY is géén bewijs voor uitgevoerde laatste stappen. Het profiel, de KPI's, waarde, AI Passport, compliance en strategie gebruiken dezelfde bedrijfscontext; leeg numeriek veld blijft onbekend en geen 0, terwijl expliciete 0 echt 0 blijft. Verwijderde bronfeiten moeten afhankelijke conclusies ongeldig maken; geen verzonnen ROI.

Gebruik alleen de oorspronkelijke dataautoriteit en exact sectiegebonden ingest. Herstel overlappende oningediende ouder-/kind-BusinessInputs uit dezelfde actuele revision; een oudere server-journal/tenantconflict blijft fail-closed. Demo kent geen durable Brain/Heartbeat-ACK en geen echte resultaten. De live source/functietest na #5598 is main `8e291bf3493fdb87d052712e97c5a8126984a3fd`, Netlify `6af411b8d9fee5cd23a504b1`, browser 16 pass/1 skip/0 fail https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42975963909. De **2 echt geïsoleerde klanttenants** met onafhankelijke schrijf/heropen/readback, downstream Powerhouse/Heartbeat-respons en verbeterde advies-output blijven onder originele #4215 **EVIDENCE_DUE**. Bewaar exact provider-ID, identity/tenant, affectedPages, datarevision, causal impacts, observatie, risico, herstel en regression onder oorspronkelijke learning lineage. Verplicht `tests/brain-portal-agent-skill-causal-truth-20261111.test.mjs`; geen nieuwe agent, DB, writer, scheduler of bypass.
 
## 11 november 2026 — Company Graph en Outcome Memory alleen met onafhankelijke causaliteit

Incidentfingerprint `company-graph|unrelated-first-item-causal-link-and-false-realized-value|20261111-v1`; oorspronkelijke owners #4215 (tenant-portaal) en #4198 (uitvoering, effect, leren).

De contextuele "Ziet → Begrijpt → Beslist → Doet → Leert"-weergave gebruikt uitsluitend hetzelfde bestaande, geautoriseerde tenant-runtime-snapshot en **dezelfde** `verifiedCustomerOutcome`-poort als `outcome-feedback.js`. Het eerste element uit problemen/kansen/acties/uitkomsten zijn niet vanzelf gerelateerd. Teken een pijl alleen als expliciete `problem_id`, `opportunity_id` of `action_id` exact overeenkomt. Resultaatwaarde vraagt onafhankelijk VERIFIED/OUTCOME_VERIFIED/REALIZED_VERIFIED, healthy source evidence, source_refs, action_id, numerieke typed amount, unit, metric, baseline en measurement period. NOOIT een leeg/ongeldig bedrag converteren naar €0.

Een losse learning-tekst, provider-ACK of bronstatus is geen toegepaste les. Toon "Geleerd" uitsluitend bij hetzelfde geverifieerde outcome + onafhankelijk learning-bewijs + `next_decision_id`. De vijf processtadia blijven in dezelfde bestaande UI: zonder onafhankelijke uitvoering blijft "Doet" onbewezen; zonder next decision blijft "Leert" onbewezen. Verwachte waarde is uitsluitend voorzien van typed estimate/forecast en eigen bronbewijs, nooit verwarren met realisatie. Geen tweede Company Graph, scheduler, klantdatabase of nieuwe agent.

Regression `tests/brain-company-intelligence-contextual-portal-shadow-canary-v1.test.mjs`: expliciete match, mismatch, ongetypeerd fictief bedrag, ontbrekend proof, tenant A/B; verplicht historische replay + shadow + canary, originele protected CI/CodeQL/BRAIN, exact-Netlify-ready en echte tenant/browserreadback. Deze UI-poort is **geen** onafhankelijke klantorder, betaalde omzet of Heartbeat learning readback. #4215/#4198 blijven open totdat echte einduitkomsten door de oorspronkelijke owners worden bewezen.


## Cross-sector verified improvement loop — 2026-11-15

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Fingerprint: `powerhouse|customer-value|cross-sector-baseline-and-tenant-proof-mismatch|20261115-v1`.

Business Flow, Margin Intelligence and Operational Control are **sector-facing configurations of the same original** Company Intelligence OS, not new agents, queues, schedulers, value stores, authorization services or independent operating systems. Sales, operations, finance, knowledge, risk and innovation reuse the original Portal V2 BusinessInput -> ONE BRAIN obligation -> existing Powerhouse action owner -> Heartbeat provider/outcome readback -> original Outcome Memory -> verified learning -> Portal V2 cycle. Sector labels change the KPI or workflow, never the evidence authority.

For **each customer improvement** record and retain original authenticated tenant, source revision, problem / business target, canonical action-id, explicit owner, original baseline ID and period, KPI definition and unit, expected value with uncertainty, approved execution boundary, original consumer receipt, independent provider/action evidence, actual measured period and exact same-baseline outcome evidence. If original action and outcome contain tenant IDs, an explicit mismatch is rejected; the upstream authenticated tenant-scoped server projection remains mandatory even when one ID is absent. A baseline mismatch is never a verified improvement. Do not compare different units, periods or customer scopes, fabricate a measured ROI, conflate saved hours with cash savings, or attribute causality without a valid comparison design.

Every outcome must flow back into the **same** original ONE BRAIN obligation, original incident fingerprint and Heartbeat/Company Intelligence learning, with source-bound receiving ACK and next-natural-run consumption. A produced obligation (OPEN), a technical ACK, deployment-ready or a verified-but-unattributed measurement are **not** executed business value or learned change. Keep nonterminal outcomes visible with owner, retry/repair action and last proof time; never silently drop or auto-close them. An absent provider consent, source evidence or policy authorization yields a safe HOLD with bounded recovery, never a bypass or duplicate external action.

Cross-sector delivery starts with one productized customer process; require one business baseline, one measurable intervention, independent readback and a costed outcome before declaring a repeatable product. Reuse the existing Company Intelligence portal proof; do not create a second sector dashboard as an alternate truth. Guard: `tests/brain-multisector-original-value-lineage-20261115.test.mjs`.


## P0 2026-11-15 — financiële intelligence, forecasting, fricties en werkelijk resultaat in bestaande Portal V2

De oorspronkelijke, geauthenticeerde customer-value-briefing en Impact-pagina zijn de customer-facing projectie. Iedere ondernemingsactie hoort in dezelfde ORIGINAL Company Intelligence → ONE BRAIN → Heartbeat → Portal lus: probleem en bron, financieel nulscenario, downside/base/upside met horizon, brongebonden modelversies en theorieën, aantoonbare aannames, fricties en kosten, geautoriseerde uitvoering, onafhankelijke provider/readback, werkelijk netto resultaat versus forecast en volgende leerbeslissing.

- Scenario's zijn nooit actuals: vereis één financieel bronrecord voor dezelfde tenantactie, baseline en periode; expliciet no_action, downside, base, upside; gezond bronbewijs, euroeenheid, per scenario bronreferenties, één of meer brongebonden modellen met versie en aannames. Ontbreekt iets, toon de gaten, geen fictieve schattingen.
- Bruto effect, implementatiekosten en operationele kosten zijn aparte onafhankelijke meetwaarden. Netto bespaard wordt alleen getoond bij een door ONE BRAIN geverifieerd resultaat met exact action/tenant/baseline/period/metric, expliciete no-action-referentie, bewijs van de echte uitvoering en een rekenkundige bruto-minus-kosten-controle. Zonder die elementen is het onbekend, niet nul. Geen causaal effect claimen zonder zelfstandig tegenfeitelijk bewijs.
- Forecast-werkelijkheid alleen vergelijken bij identieke meetlat NET_SAVINGS_EUR, baseline, horizon en eenheid. Een ‘done’ status, provider-ACK of gemodelleerde expected value is nooit bewijs van financieel rendement.
- Actie-afsluitbaarheid in het portaal is alleen READ_ONLY; werkelijke sluiten gebeurt uitsluitend via de bestaande originele provider- en ONE BRAIN-authorisatie na uitvoering, gemeten outcome, consumer-readback en volgende leerbeslissing. Nooit een tweede agent, workflow, scheduler of financieel geheugen creëren.
- De Impact-pagina mag afwezige revenue/cost capacity nooit met een nulbedrag presenteren. Maak ontbrekende brondata zichtbaar als ‘Nog niet gekwantificeerd’.
- Productiebronmeting op 2026-11-15: 14.732 bestaande actie-economieprojecties; alle business_value_status=no_resource_evidence; 829 acties zijn ‘done’ zonder geverifieerde netto waarde; portal_financial_forecasts_v1=0 en powerhouse_realized_values=0. Dit is een open DATASPINE/FINANCIAL_OUTCOME-obligatie, niet commercieel succes. Originele datakoppelingen moeten de echte financiële brondata en meettijdstippen aanleveren.
- Regressie tests/brain-financial-decision-proof-20261115.test.mjs en oorspronkelijke briefingtests. P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198; fingerprint powerhouse|financial-intelligence|forecast-versus-net-realized-proof-gap|20261115-v1.


## 2026-11-15 — werkelijk uitgevoerde aanbevelingen en afsluitbewijs op dezelfde directiecockpit

**Original owner / fingerprint:** Company Intelligence OS, authentic Portal V2, ONE BRAIN action authority; `powerhouse|financial-intelligence|original-action-execution-measurement-closure-invisible|20261115-v1` onder #4198. De bestaande executive-cockpit projectie moet niet alleen de volgende aanbeveling maar ook de laatst uitgevoerde/afgeronde tenantacties (optioneel `source.action_history`) via dezelfde `normalizeEvidenceEnvelope` en tenant-evidence gate tonen. Hergebruik tevens echte action-statussen binnen `next_best_actions`; dedupe op originele ID. Geen aparte frontendbron of globale action-query.

**Menselijk begrijpelijke bewijsstatussen per actie:**
1. Status in de operationele bron (DONE / COMPLETED / SENT / QUEUED / ...). Deze is uitsluitend een *registratie*, niet bewezen externe uitvoering.
2. Onafhankelijk uitvoeringsbewijs met exact action-ID, tenant, baseline en oorspronkelijke provider-ID; ontbreekt dit, toon `Uitvoering niet onafhankelijk bevestigd` ongeacht het geregistreerde statuslabel.
3. Onafhankelijk getypeerde outcome-meting in dezelfde actie, baseline en periode; zonder match geen gerealiseerde hoeveelheid of geld.
4. Netto besparing uitsluitend na gemeten bruto resultaat minus volledige implementatie- en exploitatiekosten en onafhankelijke no-action-vergelijker. Een modelverwachting, sales `done`, provider `sent` en `execution_completed` zijn nooit verdiend geld of financieel effect.
5. Leerbewijs (bronrefs, oorspronkelijke volgende decision-ID) en eventueel original ONE BRAIN `closure_proof` met `CLOSED_VERIFIED`, `original_authority=ONE_BRAIN`, onafhankelijke readback, exact source action/tenant/baseline en refs.
6. **Review-ready** is niet **closed**. Een gewone, niet-financiële verified metric (uren, aantal, percentage) kan onder oorspronkelijke policy klaarstaan voor afronding na gevalideerde uitvoering + meting + learning; bij een financieel netto-besparingsresultaat zijn de kostprijscomponenten verplicht. Sluit nooit rechtstreeks via read-only klant-HTML of de client-side decision store.

**Behouden toezicht:** de oorspronkelijke authenticated server moet tenant-gebonden action_history werkelijk leveren, niet de globale `powerhouse_sales_actions` uitlezen in de browser. `DONE` zonder receipt blijft open bewijsverplichting en nooit groen. De oorspronkelijke ONE BRAIN owner moet het status- en meetbewijs afhandelen en definitieve closure readback terugschrijven binnen dezelfde lineage; als action_history niet is aangeleverd, toont de cockpit een expliciete bronstatus. De Frontend is geen SSOT.

**Test:** `tests/brain-original-action-proof-closure-visibility-20261115.test.mjs` plus de bestaande financial-decision, customer-value, tenant en executive-projectietests. Kleine brongebonden UI-uitbreiding zonder nieuwe scheduler, database, provider-write of agent. Alle incidenten en conclusies blijven onder https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.


## P0 2026-11-15 — zelfstandige financiële driverforecast bij bestaande ONE BRAIN-actie

Fingerprint `powerhouse|financial-intelligence|source-driver-forecast-no-invented-net-savings|20261115-v1` onder https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Gebruik de bestaande originele `powerhouse.executive.next_best_actions` met tenant-evidence en indien aanwezig `action.financial_model_inputs`. De bestaande read-only customer-value-briefing leidt daaruit nu zonder extra scheduler of modelwriter de vier scenario's af: niets doen, tegenvaller, basis en meevaller. De oorspronkelijke tenant-bron moet de inputs aanleveren; ontbreekt de financiële bron, dan blijft `EVIDENCE_DUE` zichtbaar. Niets wordt synthetisch ingevuld.

**Economische/operationele modellen:** Time-Driven Activity-Based Costing (afhandelvolume × vermijdbare minuten × volledig uurtarief), Lean-rework (herstelwerk × kosten) en conditioneel Theory of Constraints/throughput of unit economics (extra aantoonbare units × contributiemarge, nooit omzet als winst). De modelnamen en -versies moeten uit gecontroleerde tenantbronnen komen. Zonder betrouwbare kosteninformatie geen euroclaim. Alleen als `cash_capture_fraction` expliciet brongebonden is, mogen vrijgemaakte uren financieel worden gewaardeerd; capaciteit vrijspelen is op zichzelf geen kasbesparing. Risico's en gemiste omzet vragen aparte financiële onderbouwing en komen niet automatisch in netto besparing.

**Originele input:** exact actie-ID, tenant-ID, baseline-ID, meetperiode, bronrevisie, forecast-horizon, valuta EUR, versie en per-veld source_refs, inclusief alle kosten, arbeidsminuten, bruto-/reworkvolume, cash-capture-aandeel, implementatiekosten en terugkerende operationele kosten. Vier afzonderlijk onderbouwde aannamesets, met `no_action` op nul voor de *incremental* verandering. `NET_SAVINGS_EUR` sluit extra verkoopunits uit; wanneer een interventie ook contributiemarge uit extra verkoop levert, is de uitkomst `NET_ECONOMIC_VALUE_EUR` en mag zij niet automatisch met een netto-besparingsmeting worden vergeleken.

**Sluitend werk:** deze scenario's blijven verwachtingen (model), nooit echte uitvoering. Voor daadwerkelijke actieafsluiting blijft de bestaande ONE BRAIN-authority vereist: brongebonden besluit, geautoriseerde providerwijziging, onafhankelijke provider-ID/readback, vóór- en nameting met gelijke KPI/baseline/horizon, geobserveerde kosten, causale referentie en learning, daarna brongebonden originele closure. Geen frontend-schrijfroute, geen fake `DONE` of geforceerde nulwaarde.

**Regressie:** `tests/brain-source-bound-financial-scenario-decision-loop-20261115.test.mjs`. Productiegat bij inspectie: `portal_financial_forecasts_v1` en `powerhouse_realized_values` leeg, bestaande 14 optimizerkandidaten `review_required`. Laat hetzelfde originele bedrijfsketen-/agentlandschap nieuwe tenantbronmetingen en echte acties verwerken, beveiligde Required/CodeQL, exact Netlify-SHA en onafhankelijke effectmeting verplicht. Deze bron- en rekenlaag blijft een **modelvoorwaarde**, geen zelfgeclaimde gerealiseerde besparing.


## Source-gated autonomous business optimization — decision contract (2026-11-15)
Fingerprint: `powerhouse|company-intelligence|source-gated-decision-to-verified-outcome|20261115-v1`.

This is an extension of the **existing** Company Intelligence OS, not a new optimization service. The pure `decideCompanyOptimization` export in `brain/company-intelligence/company-intelligence-os.mjs` is available to the existing original owner and the `buildCompoundIntelligence({optimization})` output. A returned eligibility decision **does not execute anything**.

Mandatory states, in order:
1. Tenant-scoped, current canonical observation with source revision and correlation; missing source means `SOURCE_EVIDENCE_DUE`.
2. Original candidate identity, source-backed measured baseline and four distinct financial scenarios (including zero-incremental **no action**). Reject synthetic EUR, missing provenance and proposed savings without underlying economic measurements.
3. `safe_reversible` plus rollback, with non-negative downside and positive base net scenario; all alternatives otherwise remain `MEASUREMENT_OR_POLICY_REVIEW_DUE`. No automatic approval of existing `review_required` candidates.
4. Only under the existing approved tenant policy, active matching original owner lease, exact candidate, immutable idempotency key and revision can the pure decision emit `READY_FOR_ORIGINAL_EXECUTOR`. Original Powerhouse action/agent fabric is the **only** writer/dispatcher, with independent provider readback and no duplicate send.
5. Receipt without baseline-linked independent counterfactual and actual net costs gives `INDEPENDENT_MEASUREMENT_DUE`; measured outcome without next-decision learning gives `NEXT_DECISION_LEARNING_DUE`.
6. `ONE_BRAIN_CLOSURE_REVIEW_DUE` is **not** closed. The original ONE BRAIN authority must separately verify and transition the original obligation, preserving exact tenant/action/baseline/period/source revision/owner/consumer ACK and effect evidence. Observed zero is valid; absent evidence is unknown.
7. Project the reason and next original owner in the existing authenticated Portal V2 customer decision journey; never expose another tenant's data or infer customer savings from a pure model or green CI.

This contract is an **eligibility/veto guard**, not a new producer, scheduled executor, connector, data store, autonomous provider action, completed handoff or customer saving. Next source owner must close original financial DATA_GAP obligation `8a0a5a8d-595f-4bb1-8522-14a9507cb7f7` using measured tenant-specific source rows, no invented amounts. Operational acceptance is still governed by original P0 issue https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215 and protected Required/CodeQL/main/exact Netlify/tenant/provider/Heartbeat proofs. Regression: `tests/brain-company-intelligence-os-v1.test.mjs`.


## 2026-11-15 — Original Outcome Memory: a nonempty evidence JSON is not a verified result

Fingerprint: `powerhouse|outcome-memory|nonempty-evidence-false-green|20261115-v1`. Reuse original P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215 and financial DATA_GAP ONE BRAIN ID `8a0a5a8d-595f-4bb1-8522-14a9507cb7f7`; do not introduce another owner, scheduler, provider write, queue or evidence store.

The original `public.powerhouse_outcome_memory_v1` is the read-only authority for whether an outcome is *verified*. An arbitrary nonempty JSON object, an internal `not_executed` / `execution_completed` status, a delivery `sent` receipt, or `synthetic_business_result=false` **does not** establish verified customer reaction or realized value. Enforce a readback of the **same original** `powerhouse_runtime_events` row: exact immutable event ID/type/dedupe, matching company/person, causal event timestamp, nonempty source evidence, and independently classified `data_quality='VERIFIED'`. Only a qualifying observed business event enters outcome memory as verified. Source quality OBSERVED without independent proof stays evidence due. `powerhouse_realized_values` additionally requires actual amount, independent readback and source revision, baseline and period. Observed numeric zero is valid; missing numeric source stays NULL/UNKNOWN. Do not infer positive customer savings from a verified engagement or publication event.

The existing Compound Intelligence view consumes these exact verified outcomes automatically; do not create another learning view or manually promote historical outcomes. When verified source count falls after a corrected guard, preserve all historical rows unchanged and explain the new ratio; this is **repairing false-green interpretation**, not losing data. The original Powerhouse/Heartbeat/ONE BRAIN owner must separately prove provider execution, customer effect and next-decision change. No autonomous execution may follow from a verified boolean alone; retain existing approval, tenant, lease, rollback and idempotency boundaries.

Original protected source path: `supabase/migrations/20261115170000_outcome_memory_source_readback_truth_v1.sql`; original pure JS contract: `brain/company-intelligence/company-intelligence-os.mjs`; regression `tests/brain-company-intelligence-os-v1.test.mjs`. Release gates: native Supabase preview, exact applied migration and source lock, Required + CodeQL protected PR, exact production readback and original ONE BRAIN consumer ACK. The original Company Intelligence SQL orchestrator and actual autonomous customer optimization remain separately unproven while their source/consumer receipts are missing.


## 2026-11-15 — original daily Company Intelligence runtime bridge, no duplicate commercial dispatch

Fingerprint `powerhouse|company-intelligence|original-daily-source-observer-no-second-send|20261115-v1`. This is a repair to original P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215, not a new agent/scheduler/CRM/queue. The existing daily cron #107 calls `public.powerhouse_run_self_improvement_layer_v1(date)`. Its original daily loop must also call the **existing** `public.powerhouse_run_company_intelligence_os_v1(date)` after original innovation intake and snapshots have been recorded.

**No duplicate side effect:** the original Company Intelligence function must **NOT** call `public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)` again. That original commercial pipeline runs many research, outreach and provider-dispatch stages via its own authorized owner. Instead consume the most recent **same Europe/Amsterdam date** verified source event from existing `public.powerhouse_runtime_events` with `event_type='trigger_based_mkb_acquisition_cycle'`, exact original owner `powerhouse-trigger-based-mkb-acquisition-runtime-v1`, immutable event ID/dedupe and evidence run date. Record source observation or `ORIGINAL_COMMERCIAL_SOURCE_EVENT_DUE` only. Do not take provider-send claims from the event as independent provider-GET evidence.

**One original receipt:** `company-intelligence-os:<local-date>` is idempotently upserted into the **existing** `public.powerhouse_runtime_events` with source `company-intelligence-os.v1`, `event_type=company_intelligence_os_cycle`, `state=observed` and `data_quality=SOURCE_RECEIPT_ONLY` or `SOURCE_EVIDENCE_DUE`. Do not mark `data_quality=VERIFIED` because existence of the company snapshot is not independent customer effect or an executed autonomous optimization. The original daily self-improvement receipt must include source-event ID, status, and typed error handling; an observer failure or missing original source must never appear as a green combined cycle.

**Financial proof remains separate and due:** original portal financial forecasts, verified billing/time action inputs, policy-scoped reversible optimization, external provider GET, no-action comparator, realized net after implementation/operating costs, Heartbeat and original ONE BRAIN next-decision ACK. Neither aggregate actions, expected opportunity value, a source event nor a test proves money saved. Source absence must stay UNKNOWN / EVIDENCE_DUE, not zero benefit or success. Never create a second scheduler, run broad commercial outreach on a second path, or authorize an agent to bypass consent, lease, rollback or original idempotency gates.

Original protected source: `supabase/migrations/20261115235900_company_intelligence_existing_daily_source_receipt_v1.sql`; regression `tests/brain-company-intelligence-daily-source-receipt-20261115.test.mjs`; original consumer `public.powerhouse_run_self_improvement_layer_v1(date)`, original cron #107. Production closure requires independently verified exact migration, native event ID and caller evidence, source-to-Company snapshot-to-ONE BRAIN lineage, and no second commercial provider send. The original financial P0 stays OPEN until real net value is independently measured, learned and closed.

## Portal V2 signalering → advies → actie → uitkomst (2026-11-20)

Fingerprint `portal-v2-voice-signal-advisor-v1`, originele eigenaar ONE BRAIN/Powerhouse/Heartbeat, kandidaat PR #6082.

- Ondernemers mogen gesproken of getypte vragen stellen, signaleringsgrenzen vastleggen en vanuit **werkelijk getriggerde** afwijkingen een onderzoekstaak met eigenaar en deadline maken. De agent moet vóór ieder advies bron, context, meetwaarde, grens, onzekerheid, prioriteit, voorgestelde actie en bevoegdheid presenteren.
- Bewaar de regel en taak uitsluitend via de bestaande geautoriseerde `Portal State → BusinessInput → ONE BRAIN`-route; verifieer na write de exacte tenant, waarde en revision. Een klik/navigatie, taakvoorstel of lopende scheduler is géén succesvolle autonome uitvoering.
- De oorspronkelijke Powerhouse-actielaag kiest uitvoering alleen met passende risicoklasse en expliciete goedkeuring waar vereist; Heartbeat beoordeelt onafhankelijke source/provider/consumer-effecten, dedupliceert hetzelfde signaal per tenant/bron/revisie en registreert geleerd effect. Zonder origineel server-side monitoring-, kanaal-/push- en providerbewijs: **niet 24/7-live** melden.
- Verkeerde bron, onbekende versheid, missing KPI, verlopen consent, ongelijke readback of ontbrekend effect zijn zichtbare open verplichtingen, geen groene resultaten. Herstel bij de oorspronkelijke eigenaar zonder parallelle cron of samengevoegde onherleidbare signalen.

## 20 november 2026 — originele Heartbeat-eigenaar van portaalalerts
Fingerprint `portal-v2-voice-heartbeat-closure-v2`; portaalouder #4547.
- Het bestaande vijfminuten-`powerhouse-commercial-heartbeat-runner` mag een **afzonderlijke, begrensde en niet-blokkerende** tenantgebonden regel-evaluatie doen op `public.portal_state_layers`. Gebruik alleen exact bekende KPI-bronpaden, gebruikers-`monitoring:true`, één gehashte tenant-/regel-/bronrevisie-dedupe en één oorsprongsgecontroleerde `powerhouse_runtime_events` readback. Uitval mag de originele commerciële uitvoeringslus niet stilleggen.
- Handmatig ingevoerde portaalwaardes zonder expliciete KPI-meet-timestamp hebben **UNKNOWN measurement freshness**. Hun drempeloverschrijding is een voorlopige observatie, geen geverifieerde live anomalie, financieel resultaat, of toestemming voor een externe notificatie.
- E-mail/push is afzonderlijk opt-in per echte ontvanger met geldige gegevens, wettelijke toestemming, suppressie, leverbare bestaande verzendcapaciteit, consent/approval, een provider message ID en onafhankelijke delivery-readback. De huidige server-observer **verstuurt niets**. Schrijf nooit `sent:true` zonder de provider.
- Beperk autonome vervolgacties nu tot veilige analyse/voorstel/waargenomen actie. Materiële of onomkeerbare acties blijven in de oorspronkelijke `Powerhouse Agent Fabric` tot na risicoanalyse, bevoegde goedkeuring, exact idempotent execution ID, consumer/provider-readback en onafhankelijk Heartbeat-effect. Een nieuw event is geen uitgevoerde actie.
- Een regeling is pas volledig `GREEN` met productie-release- en tenant-/providerbewijs, 24/7 natuurlijke scheduler-ontvangst, channel readback, effectmeting en toepasbaar leerbewijs. Vermijd nieuw cron-werk, workflowforks en foutieve claim van geleverde notificaties.

## 21 november 2026 — onderscheid scheduler/tenant-scan/signal/delivery/actie

- De enige bestaande vijfminuten-Heartbeat `powerhouse-commercial-heartbeat-runner` krijgt ook zonder threshold-hit één gehashte, idempotente `portal_user_signal_scan` per consented tenant/bronrevisie/UTC-uur. Event metadata bevat uitsluitend aantal gecontroleerde regels, aantal bronhiaten en observaties; **geen** klantwaarde, ontvangeradres, platte tenantnaam of financieel resultaat.
- `portal_user_signal_scan` is OBSERVED en alleen geldig na DB-commit + onafhankelijke readback. Nooit gelijkstellen aan real-time source freshness, notificatiebezorging, provider-ID, autorisatie van agentactie of gemeten bedrijfseffect. Fail-closed en begrensde batches; onvolledige dekking = zichtbaar OPEN.
- Alle uitlezing gebeurt via de oorspronkelijke `portal-state-eu` service-gateway, filtert exacte bron, type en gehashte tenant van een server-geverifieerde Identity, en staat nooit anonieme of browsergekozen tenant toe.
- Oorspronkelijke commerciële en social executors mogen niet uitvallen door een afzonderlijke portal-observerfout; geen tweede cron/queue/sender. Uitgaande e-mail/push uitsluitend met geautoriseerde ontvangerkeuze, suppression- en provider-readback. Autonome actie uitsluitend reversible/approved via origineel fabric met onafhankelijke effectmeting.
- 0 geconfigureerde regels is het echte resultaat `WAITING_FOR_CUSTOMER_OPT_IN`, geen verzend- of schedulerincident. Laat het proces wel actief zodat de eerstvolgende echte klantregel kan worden verwerkt.
