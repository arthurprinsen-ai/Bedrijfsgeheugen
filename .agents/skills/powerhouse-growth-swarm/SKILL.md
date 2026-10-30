# Skill: Powerhouse Growth Swarm

Fingerprint: `powerhouse-growth-swarm-v1`

## Doel
Maak alle commerciële Powerhouse-intelligentie onderdeel van één revenue-first operating system. Geen losse growth hacks, losse contentmachine, losse outreach-stack of parallel CRM. Iedere play gebruikt dezelfde canonical relationships, public research, scans, benchmarks, opportunities, content recommendations, actions, outcomes en learning.

## North star
Eerst betaalde order, daarna gerealiseerde omzet. Bereik, likes, comments, traffic, scans en meetings zijn tussenstappen tenzij ze aantoonbaar leiden tot commerciële uitkomst.

## Canonieke keten
public/first-party evidence -> relationship/company intelligence -> trigger/problem hypothesis -> dark-funnel intent -> friction/knowledge/M&A risk -> expected-value hypothesis -> Growth Swarm score -> play selection -> next-best-action/channel -> execution -> provider/readback -> outcome -> learning -> volgende scoring.

## 20 canonieke growth plays
1. `mkb-friction-index` — geanonimiseerde sectorfrictie als benchmark, content en scan-ingang.
2. `prebuilt-prospect-dossier` — vóór contact al 3 observaties, 2 hefbomen, economische hypothese en volgende actie.
3. `positive-public-teardown` — publieke, behulpzame analyse van wat een bedrijf goed doet en waar publieke evidence nog ruimte toont.
4. `anti-consultancy-challenge` — waarde aantonen vóór verkoopdruk; geen loze garantie.
5. `reverse-selling` — bij lage fit of onvoldoende bewijs expliciet adviseren nog niet te kopen.
6. `trigger-hijacking` — verse bedrijfsgebeurtenis direct vertalen naar relevante contextuele actie.
7. `boardroom-fear-of-blindness` — directievragen over wat men vandaag niet weet maar bestuurlijk moet weten.
8. `lost-knowledge-calculator` — scenario-inschatting van kennisverlies; altijd als estimate gelabeld.
9. `value-before-demo` — economische hypothese vóór demo/scan, nooit als observed fact presenteren.
10. `prospect-generated-content-loop` — herhaalde prospectproblemen worden geanonimiseerde content; engagement voedt weer de intelligence.
11. `competitor-switch-pages` — SEO op concrete problemen/overstapintentie, altijd canonical-owner/cannibalization-first.
12. `ma-knowledge-risk` — Knowledge & Execution Risk voor investeerders/M&A/portfolio's.
13. `competitor-benchmark` — alleen publieke/aggregate vergelijking; geen gefabriceerde interne concurrentiedata.
14. `data-contribution-flywheel` — diepere benchmark na expliciet consent voor geanonimiseerde bijdrage.
15. `warm-referral` — na echte positieve outcome één specifieke warme intro vragen in plaats van generiek referral-programma.
16. `risk-reversal` — alleen conditioneel en evidence-backed; nooit een onbeperkte commerciële garantie.
17. `workshop-leaderboard` — anonieme workshop-percentielen + portal handoff; minimaal 5 deelnemers.
18. `dark-funnel` — zwakke signalen op accountniveau combineren; één weak signal is nooit koopintentie.
19. `we-disagree-content` — contrarian content alleen met bewijsbare claim.
20. `revenue-swarm` — dagelijkse orkestrator die accounts rangschikt, play/kanaal kiest, uitvoert of bewust wacht en daarvan leert.

## Runtime authority
- Account state: `public.powerhouse_growth_swarm_accounts_v1`.
- Revenue ranking: `public.powerhouse_revenue_swarm_v1`.
- Dark funnel: `public.powerhouse_dark_funnel_intent_v1`.
- Friction index: `public.powerhouse_friction_index_v1`.
- Workshop benchmark: `public.powerhouse_workshop_leaderboard_v1`.
- Lost knowledge: `public.powerhouse_lost_knowledge_value_v1(...)`.
- M&A risk: `public.powerhouse_ma_knowledge_execution_risk_v1(...)`.
- Refresh: `public.powerhouse_refresh_growth_swarm_v1(date)`.
- Materialization: `public.powerhouse_materialize_growth_swarm_v1(date)`.
- Public safe tools: Edge Function `powerhouse-growth-tools`.
- Catalog: `public.powerhouse_growth_play_catalog_v1` and `config/powerhouse-growth-swarm-playbook-v1.json`.
- Single scheduler-owner remains `powerhouse-commercial-learning-v1` through the existing commercial cycle.

## Revenue Swarm scoring
Score combines relationship strength, fresh trigger evidence, dark-funnel convergence, friction, knowledge/M&A risk and economic evidence. The score prioritizes work; it does not prove buying intent or revenue.

A company can receive `expected_value_eur=2900` as an entry-offer hypothesis only when fresh trigger + relationship gates pass. This remains a commercial hypothesis until an actual order/payment exists.

## Execution
- `swarm_score >= 0.35` can produce a prebuilt internal dossier.
- External action still flows through existing LinkedIn/email engines and their identity, dedupe, fatigue, suppression and provider-ack gates.
- Public content receives anonymized aggregate evidence only.
- Referral actions are internal until context is validated.
- If evidence is insufficient, the valid action is research/wait, not fabricated urgency.

## Public growth tools
`powerhouse-growth-tools` exposes only safe surfaces:
- friction-index / competitor-benchmark: aggregate groups only;
- lost-knowledge: stateless scenario calculation;
- ma-risk: stateless estimated risk;
- workshop-benchmark: no participant identity;
- revenue-swarm: private token required.

## Privacy and truth
- No personal names or private relationship facts in public content.
- Workshop/benchmark public groups require minimum sample size 5.
- External evidence is context until tenant relevance is proven.
- Financial impact labels: OBSERVED, ESTIMATED, POTENTIAL or SCENARIO_ESTIMATE.
- M&A risk is not a valuation, legal opinion or transaction recommendation.
- No fake competitor intelligence, no fake intent, no fake benchmark.

## Learning
Every play must map to one or more terminal outcomes:
reply -> meeting -> scan -> proposal -> paid order -> realized revenue.

Use `powerhouse_experiment_assignments` / effect-estimate infrastructure when sample sizes permit causal comparison. Do not promote a winning play before its measurement floor is met.


## Terminal production proof — 28 september 2026
Status: `LIVE_PROVEN`.

The earlier 13/20 proof was superseded by the 20/20 execution closure. PR #3207 is merged to protected main at `46739777d0a5563001a3520e046a29a57b0b9ec8`. Production readback confirms:
- 20 canonical growth plays;
- 20 runtime-active plays;
- 17.034 accounts in the Growth Swarm state;
- 8 prebuilt prospect dossiers;
- 8 ranked play-events;
- exactly one canonical commercial scheduler and zero parallel Growth Swarm schedulers;
- Growth Swarm refresh + materialization are both wired into the canonical commercial cycle;
- `powerhouse-growth-tools` ACTIVE v4.

Plays that lack enough real data stay ARMED/READY_FOR_SURFACE rather than inventing benchmark or intent evidence.


## Persuasion Revenue Optimizer
Fingerprint: `powerhouse-persuasion-revenue-optimizer-v1`.

Every prepared private outreach action is eligible for one final value-exchange optimization before provider dispatch:
- choose an evidence-bounded persuasion strategy;
- choose one concrete give asset;
- choose the smallest reasonable get ask;
- preserve identity, consent, dedupe, fatigue, suppression and provider-capability gates;
- write strategy metadata into the canonical sales action;
- evaluate strategy against reply -> meeting -> scan -> proposal -> paid order -> realized revenue.

The optimizer may improve framing but may not create extra send volume, fabricate urgency/scarcity/social proof, or turn public LinkedIn comments into sales pitches.


## Autonomous sales asset execution
Fingerprint: `powerhouse-autonomous-sales-asset-execution-v1`.

A Powerhouse decision is an executable obligation, not a recommendation. The owning agent completes the whole chain itself:
- e-mail -> write final copy, create required attachment, send through the authorized provider, capture provider acknowledgement and outcome;
- LinkedIn/company post -> generate unique final copy/media, publish through the canonical provider, read back and record outcome;
- public comment -> generate the contextual final comment and publish it; never stop at a suggestion;
- DM -> use the authorized DM capability when verified. If the provider cannot DM, automatically route to the highest-ranked executable fallback rather than stop;
- PDF/one-pager/benchmark/evidence dossier -> generate the actual document first, then attach or link it to the selected delivery action;
- visual/reel/carousel -> generate the actual media before publication through the canonical identity.

Draft, suggestion, CTA recommendation, asset recommendation and TODO are non-terminal states. Terminal commercial execution is: materialize -> provider execute -> provider ack/readback -> sales outcome -> learning.

### PDF execution rule
`asset_format=pdf` is authoritative. `board_one_pager`, `evidence_teardown`, `lost_knowledge_case`, `friction_business_case`, `mini_benchmark` and `peer_benchmark` default to PDF. The autonomous Gmail executor generates the PDF with the approved text-to-PDF provider and attaches it to the same outgoing e-mail before sending. Missing facts remain unknown; never invent evidence, ROI, benchmark values, urgency, scarcity or customer proof.

This rule is inherited by chats, agents, scheduled runs, Growth Swarm, LinkedIn sales, autonomous outreach and future commercial agents. Human intervention is reserved for missing authority/credentials, safety/legal boundaries or an irreducible business choice.


## 20/20 executable plays
Alle 20 canonieke plays zijn runtime `ACTIVE`. ACTIVE betekent: er bestaat een werkend trigger -> decision -> executor/surface -> metric pad. Het betekent niet dat iedere play vandaag voldoende bewijs heeft om extern te handelen.

`powerhouse_activate_all_growth_plays_v2(date)` en `powerhouse_execute_growth_play_actions_v1(date)` zijn onderdeel van dezelfde commerciële cyclus, vóór de bestaande Persuasion Revenue Optimizer en provider dispatch. Daardoor kan Powerhouse zelfstandig kiezen, uitvoeren, readback vastleggen en leren in plaats van een aanbeveling achter te laten.

## 20/20 terminal proof — 28 september 2026
Status: `LIVE_PROVEN`.
PR #3207 is merged to main at `46739777d0a5563001a3520e046a29a57b0b9ec8`. Runtime readback: 20/20 plays ACTIVE, 8 active persuasion decisions, 10 persuasion principles, one canonical commercial scheduler, zero parallel Growth Play schedulers. Recommendation-only completion is forbidden when a safe executor exists.


## Organic acquisition / SEO conversion-to-orders
Fingerprint: `powerhouse-seo-conversion-orders-v1`.

Organic search is a Growth Swarm acquisition lane, not a traffic-only content lane. Reuse `.agents/skills/powerhouse-seo-conversion-orders/SKILL.md` and the canonical SEO Growth Intelligence.

Rules:
- prioritize search opportunities on qualified-order and revenue potential;
- update the existing canonical money page before creating a new page for the same intent;
- use JTBD/PAS/AIDA/4P, risk reversal, message match and objection handling only within evidence/truth guardrails;
- cap autonomous daily SEO/CRO changes at three reversible evidence-gated changes;
- route measured CTA -> lead -> order -> revenue outcomes back into the same Growth Swarm/Brain learning;
- raw traffic, impressions and rankings are intermediary evidence, never terminal commercial success.


## Behavioral landing-page revenue optimization
Fingerprint: `powerhouse-behavioral-landing-revenue-v2`.

Commercial website pages are an execution surface of the same Powerhouse Growth Swarm and Persuasion Revenue Optimizer; never create a parallel CRO stack. Powerhouse may autonomously choose hero/message match, CTA hierarchy, proof order, objection handling, risk reversal, section order, progressive disclosure and scan-versus-conversation routing from intent, funnel stage and measured outcomes.

Use Cialdini, loss aversion/prospect theory, Fogg, Hick-Hyman, cognitive fluency, commitment ladders, specificity and choice architecture only within truth/evidence guardrails. Optimize in this order: realized revenue -> paid orders -> qualified proposals -> qualified meetings -> qualified leads -> CTA progression -> engagement. Raw clicks, scroll depth and time-on-page are never standalone winner criteria.

All changes flow through `config/seo-growth-loop.json`, `config/seo-optimization-allowlist.json`, protected delivery, production readback and outcome learning. Maximum three reversible high-confidence changes per daily cycle. Roll back on trust, accessibility, mobile-readability or qualified-conversion regression. Fake scarcity, fake urgency, fake social proof, hidden costs, confirmshaming and preselected consent are forbidden.


### Behavioral revenue writeback closure
De fingerprint `powerhouse-behavioral-landing-revenue-v2` is onderdeel van de bestaande Powerhouse authority. Bij materiële wijzigingen moeten runtime-config, deze skill-laag, Brain learning, `docs/brain/component-registry.json`, `platform/system-map/canonical-system-map.mjs`, menselijke change/ledger-documentatie en regressietests in dezelfde delivery-lineage synchroon blijven. Een runtime- of copywijziging zonder deze writeback is niet terminal.


## Bedrijfslek product-led acquisition loop — 29 september 2026
Fingerprint: `powerhouse-bedrijfslek-product-led-acquisition-v1`.

De publieke route `/zelfscan` is voortaan de value-first Bedrijfslek-instap voor de Growth Swarm:
- geen verplichte naam, e-mail, telefoon of account vóór de uitslag;
- volledige score, alle benchmarkrijen en drie concrete quick wins direct op het scherm;
- homepage primary CTA routeert naar Bedrijfslek in plaats van eerst naar een gesprek;
- na geleverde waarde mag de bezoeker kiezen tussen portaal-demo, direct Control-bestelpad of delen van de score;
- score/benchmark blijft indicatief; geen financieel resultaat of koopintentie als feit presenteren;
- `bedrijfslek-resultaat`, deelactie en checkout-start zijn commerciële tussenuitkomsten; paid order en realized revenue blijven terminale north-star outcomes;
- de final-build authority moet deze route expliciet behouden zodat een latere V18/build-transformatie de acquisition-loop niet terugzet naar een leadgate.
- `/zelfscan` is een standalone productroute en mag daarom nooit als `selfscan`-view in `tools/v18-views-lijst.mjs` staan; `tools/bouw-v18-views.mjs` mag `zelfscan.html` niet genereren of overschrijven.

Dit is geen parallelle funnel. De route blijft onderdeel van de bestaande Growth Swarm, Persuasion Revenue Optimizer, SEO Conversion-to-Orders en canonical growth-event lineage.


## Bedrijfslek teamchallenge + Mini — permanent product-led contract

Fingerprint: `powerhouse-bedrijfslek-product-led-acquisition-v2`.

De op 29 september 2026 gemergede Bedrijfslek-loop is een permanente Growth Swarm-capability, geen tijdelijke campagne.

Canonieke lus:
`organic reach → /zelfscan → volledige waarde vóór PII → score + benchmark + quick wins → Bedrijfsgeheugen Mini → privacy-safe teamchallenge → tweede gekwalificeerde gebruiker → interne vergelijking → portal/order → outcome learning`.

Verplicht:
- de eerste gebruiker krijgt de volledige bruikbare uitkomst zonder leadgate;
- Bedrijfsgeheugen Mini vertaalt de drie zwakste domeinen naar drie uitvoerbare acties en bewaart voortgang uitsluitend lokaal;
- de challenge bevat alleen score, risk category en campaign attribution;
- na challenge-completion wordt het scoreverschil zichtbaar; een verschil van 15 punten of meer mag als inhoudelijk onderzoeksignaal worden getoond, nooit als verkoopfeit;
- challenge share/copy/completion en Mini action/complete events blijven commerciële tussenuitkomsten;
- paid order en realized revenue blijven terminale commerciële waarheid;
- iedere nieuwe growth-hack rond Bedrijfslek moet deze bestaande lus versterken of meetbaar vervangen, nooit ernaast een tweede funnel creëren;
- historische duplicatie, dark patterns, verplichte PII vóór waarde, fake benchmarks en onbewezen ROI zijn verboden;
- skill, agent/chat contract, System Map, Brain learning, docs, ledger en regression guard blijven in dezelfde lineage synchroon.

Canonical public authority: `zelfscan.html`.
Regression authority: `tests/brain-bedrijfslek-product-led-acquisition-v1.test.mjs`.


## €1M Revenue Operating Contract — 29 september 2026
Fingerprint: `powerhouse-one-million-revenue-operating-contract-v1`.

Deze skill erft verplicht `config/powerhouse-one-million-revenue-operating-contract-v1.json`.

Niet-onderhandelbaar:
- North star: €1.000.000 gerealiseerde omzet binnen 365 dagen; paid order en realized revenue wegen altijd zwaarder dan bereik, traffic, posts, scans, leads of meetings.
- Elke dagelijkse commerciële run kiest uit één gedeelde next-best-action ruimte: bedrijfspost, Mira-Instagram, SEO/blog/CRO, contextuele LinkedIn-reactie, warm/consented e-mail, ondersteunde private follow-up, due follow-up, offerte/offer follow-up, warme referral, partner/workshop follow-up of value asset.
- Een gekwalificeerde veilig uitvoerbare actie wordt uitgevoerd; alleen aanbevelen/draften is niet terminal wanneer de canonieke executor beschikbaar is.
- Achterstand op omzetpace verhoogt kwaliteit en aantal gekwalificeerde research/value/follow-up-acties, maar omzeilt nooit evidence, identity, privacy, consent, suppression, dedupe, fatigue of provider-ack gates.
- Generieke cold-bulk autosend blijft verboden. Koude prospects mogen automatisch worden gevonden, verrijkt, gescoord en voorbereid; extern verzenden gebeurt alleen binnen een afzonderlijk goedgekeurde lawful/consent-based eligibility route.
- Warm/consented outreach, bestaande relatie/opportunity follow-up, due follow-up en bestaande klant-/partnercontext mogen autonoom worden uitgevoerd wanneer de bestaande gates groen zijn.
- LinkedIn persoonlijk blijft personal-life-only; commercieel air-cover hoort op de Bedrijfsgeheugen-bedrijfspagina. Instagram blijft Mira-only.
- Iedere kanaalactie schrijft terug: provider/readback → reply/meeting/scan/proposal/order → realized revenue → learning → volgende prioritering.


## Bounded commercial candidate refresh — 29 september 2026
Fingerprint: `growth-swarm-bounded-refresh-v1`.

De Growth Swarm mag nooit eerst de volledige relatie-/personenpopulatie materialiseren en daarna pas commerciële kandidaten selecteren.

Verplicht:
- candidate-first op verse trigger-, opportunity-, predictive-, scan- en outcome-signalen;
- alleen kandidaatbedrijven/personen verrijken en scoren;
- bestaande dedupe, consent, suppression, cooldown, identity en revenue-truth gates blijven intact;
- population-wide materialisatie via `powerhouse_person_intelligence_v1` of `powerhouse_company_intelligence_v1` vóór candidate pruning is een regressie;
- commerciële schedulers moeten binnen hun bounded runtime-window eindigen en evidence terugschrijven.


## Source-backed outbound convergence — 2026-09-29
Fingerprint: `powerhouse-source-backed-all-channels-v1`.

Growth Swarm routes the same evidence spine into channel-native actions: company LinkedIn and blog from market/problem evidence; email and LinkedIn DM only from account/person-relevant triggers plus relationship context; personal LinkedIn from public topic evidence only when identity/truth gates permit; Instagram from public daily-life friction. Every send/post preserves source lineage and returns reply, engagement, lead, order and revenue outcomes to prioritization.

## Value-asset comment funnel (2026-09-30)

Fingerprint: `powerhouse-value-asset-comment-funnel-v1`.

Powerhouse treats useful free assets as revenue plays, not vanity engagement:
public signal/research -> high-utility asset -> single-language LinkedIn post -> comment-intent token -> canonical DM delivery -> relationship enrichment -> qualified follow-up -> meeting/proposal/order -> realized revenue -> learning.

Preferred asset classes:
- numbered practical playbooks/checklists;
- automation/use-case libraries;
- ROI/cost calculators;
- benchmarks/scorecards;
- prediction/foresight briefs;
- governance/privacy/risk guides;
- role/department AI stacks and decision maps.

Hard rules:
- solve a concrete user problem before selling the portal;
- every asset may carry a subtle portal/scan path, but the post remains value-first;
- comments are not the success metric; qualified conversations, meetings, proposals, orders and revenue are;
- all new asset/post families pass global historical semantic dedupe;
- campaign learning re-scores audience, hook, language, keyword, completion, reply and revenue outcome.


## LinkedIn company-page growth lane — 4 oktober 2026
Fingerprint: `powerhouse-linkedin-company-growth-v1`.

De LinkedIn-bedrijfspagina is een expliciete acquisition/distribution lane binnen dezelfde Growth Swarm, geen los social-growth systeem. Reuse `.agents/skills/powerhouse-linkedin-company-growth/SKILL.md`, `config/linkedin-company-growth-v1.json` en `public.powerhouse_refresh_linkedin_company_growth_v1(date)`.

Verplicht:
- organisatie-identiteit `urn:li:organization:18234216`;
- baseline 4 oktober 2026: 12 paginaweergaven, waarvan 10 desktop en 2 mobiel;
- eerste operationele target: 300 paginaweergaven/30d en 100 relevante nieuwe volgers/30d;
- maximaal drie bounded growth-aanbevelingen per dag;
- dezelfde canonical content-recommendation, dedupe, source, provider-readback en revenue-learning authority;
- geen commerciële traffic-bridge via het persoonlijke LinkedIn-profiel;
- views/followers zijn tussenmetingen; paid order en realized revenue blijven terminale north star;
- dezelfde bestaande commerciële scheduler blijft owner; een parallelle LinkedIn-growth scheduler is verboden.

## SalesRobot unknown-send result — 20 oktober 2026

Fingerprint: `commercial|linkedin-salesrobot|ambiguous-provider-send-no-resend|20261020`.
Een SalesRobot-fout na het versturen kan betekenen dat de provider de DM al heeft geplaatst. De canonieke `powerhouse-linkedin-sales-machine` moet de oorspronkelijke action-ID op `waiting` houden en `needs_readback=true`, `republish_forbidden=true` registreren. Geen fallback-kanaal, automatisch opnieuw verzenden of status `done` zonder onafhankelijke ontvangst-/inbox-ID. Pas bij echte providerreadback mag de bestaande outcome-reconciler afronden. Als de providerlicentie/cookie/campagne ontbreekt: `UNAVAILABLE/CONFIG_REQUIRED`, nooit groen. Bestaande consent, human approval, suppressions, cooldown, berichtkwaliteit en één scheduler blijven bindend. P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.


## Provider readiness onafhankelijk van content en AI — 20 oktober 2026
Fingerprint: `commercial|salesrobot|early-truth-readonly-canary|20261020`.
De bestaande `powerhouse-linkedin-sales-machine` moet de werkelijke SalesRobot-licentie, cookie, actieve campagne en uitvoeringsdagen vóór voorbereidende AI-/composer-acties controleren en de bestaande `powerhouse_channel_capabilities_v1` registraties voor DM én campagnes bijwerken. Een upstream AI-storing mag de providerstatus niet bevriezen. Een `dry_run` is alleen lezen: geen SQL-materialisatie, composer, send of evidence-mutatie. Geen tweede scheduler, sender of CRM. Echte verzending blijft afhankelijk van individuele toestemming, human approval, kwaliteit, suppressions, cooldown, providerbevestiging en onafhankelijke readback. Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.


## Composio v3.1 SalesRobot user-identity gate — 20 oktober 2026
Fingerprint: `commercial|salesrobot|composio-user-id-required|20261020`.
Het Composio-v3.1-executecontract van de bestaande Powerhouse LinkedIn-salesmachine vereist zowel de echte `connected_account_id` als de bijbehorende `user_id` uit dezelfde actieve Composio-accountregistratie. Zonder `user_id` gaf de echte productieruntime bij `SALESROBOT_LIST_LINKEDIN_ACCOUNTS` HTTP 400, terwijl beide gecontroleerde accountregistraties met die `user_id` HTTP 200 gaven. Behoud de bestaande licentie/cookie/campagne- en ontvangersautorisatievoorwaarden; de API-fix is geen toestemming om DM's te versturen. Geen secret- of account-ID hardcoding; één bestaand transport en één scheduler.


## Provider-verifieerbare LinkedIn-DM closed loop — 20 oktober 2026
Fingerprint: `commercial|salesrobot|receipt-before-done|20261020`.
`SALESROBOT_SEND_MESSAGE` kan bij een geslaagde HTTP-response nog geen onafhankelijk verzendbewijs opleveren. De bestaande Powerhouse LinkedIn-salesmachine houdt na de ack de originele action op `waiting`, slaat de provideridentificatie op, markeert `needs_readback=true` en `republish_forbidden=true`; er mag geen `done`/sent-outcome ontstaan uit alleen de ack. Reconcile uitsluitend met een uniek `salesrobot_linkedin_dm_sent`-event met exacte provider-inbox-message-ID, prospect-UUID, sent-by-me, SENT, readback en passend tijdstip; schrijf dan de canonieke `powerhouse_sales_outcomes` en markeer dezelfde action done. Een ontvanger vereist bovendien `bg_connecties.extra.human_approved=true` en mag niet geblokkeerd of uitgesloten zijn. In afwezigheid van onafhankelijke provider readback: wachten/blocked, niet herversturen of groen verklaren. Eén bestaand CRM, scheduler en agent blijven owner. Parent #4198.


## Bestaande hourly assurance — SalesRobot herstel zonder extra scheduler (20-10-2026)
Fingerprint: `commercial|salesrobot|existing-hourly-provider-preflight|20261020`. De bestaande `powerhouse-autonomous-outreach-assurance-hourly-v1` Cron-taak verricht ook een veilig `provider_preflight`-readback bij de bestaande `powerhouse-linkedin-sales-machine`. Er komt geen aparte scheduler, direct-message-executor of dubbele campagne. Uitsluitend providerstatus + blokkades worden in `powerhouse_channel_capabilities_v1` bijgewerkt. Lokaal Composio ACTIVE zegt niets over SalesRobot-license, cookies of campagne. Bewaar deze oorzaken los en expliciet, maak 10 suggested acties nooit gelijk aan 10 verzendbare DM's. Alle bestaande autorisatie-, anti-dubbel-, compositie- en providerreadbackguards blijven. Parent P0 #4198.


## 20-10-2026 — Sociale omissies, herstel van dubbele persoonlijke bron
Fingerprint `social|linkedin-personal|obligation-hold-dedupe-reconciliation|20261020`.
Een `content_publication_obligations` met `GLOBAL_POST_DUPLICATE_BLOCKED` is alleen herstelbaar wanneer exact de oude dagbeslissing `blocked`/zonder `delivery_ref` is, de oorspronkelijke publicatieautoriteit wel uitgegeven maar **niet** verbruikt is, en geen provider create/ack/readback of mogelijk neveneffect aanwezig is. Na een afwijkende `hold`-normalisatie moet de centrale orchestrator die twee canonieke staten reconciliëren, eerder geweigerde bronidentiteiten uitsluiten en pas opnieuw genereren vanuit een andere onafhankelijk geverifieerde bron. Herhaal nooit hetzelfde verhaal. De bedrijfspagina met bevestigd provider-ID mag niet opnieuw worden gepost; Instagram vereist aantoonbaar eindmediabewijs; e-mailcontacten vereisen toestemming. Geen nieuwe scheduler, Buffer-route of duplicaat.


## Productieherstel — bounded contact authority & identity Cron (20-10-2026)
Fingerprint: `commercial|contacts|bounded-review-cron|20261020`. Behoud exact bestaande Cron-job `powerhouse-identity-graph-v1` (jobid uit huidige database, geen nieuwe job), dagelijks alle 23k+ relaties beoordelen zonder piek van 2×500 enrichment + 4×500 autoriteitsupdates per slot. Eén pulse van 200 plus één contactautoriteitsbatch van 200 per slot, zes slots per uur `2,17,32,42,47,57 * * * *`; minuut 52 blijft vrij voor bestaande outreach assurance; identiteitsgrafiek-reconciliatie om minuut 32 blijft intact. Dagcapaciteit per stroom = 200×6×24=28.800 theoretisch; geen voltooiingsbewijs zonder readback van werkelijke dagtellers. Sla `BUSY` bij advisory lock niet als voltooid op, probeer dezelfde canonical taak bij volgend normaal tijdslot. Geen tweede scheduler, geen uitgeschakelde executor, geen automatische e-mail- of DM-toestemming. Herstelmigratie `20261020114500_identity_review_bounded_cron_v1.sql` accepteert originele én handmatig begrensde toestand, faalt gesloten bij code- of schedule-drift. Logiek plus regression in `tests/brain-identity-review-bounded-cron-v1.test.mjs`. P0 #4198.

## P0 #4198: bounded authority queue, no duplicate sends (2026-10-20)
Fingerprint: `commercial|authority|queue-preselect-skip-locked|20261020`. Live SQL contact authority review was joining/suppression-evaluating 23k contacts before applying the candidate batch bound. After repeated 30-second statement timeouts and existing single-owner Cron reduction to a 200-row pulse and one 200-row authority batch, the canonical DB migration now materializes a small queue FIRST with `FOR UPDATE SKIP LOCKED` before the original contact join, preserving every existing authorization/suppression/cooldown gate. Cron job `powerhouse-identity-graph-v1` remains active and existing; do not invent consent or disable a scheduled executor. Test exactly on the existing SQL function and real patient rolling coverage, not on a synthetic green response. Parent #4198.

## Continuous CRO Lean / Growth Hacking experimentation (29 oktober 2026)
Fingerprint: `powerhouse|cro-experiment-intelligence|lean-pdca|20261029-v1`.
INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1

**Iedere bestaande CRO-, Growth Swarm-, SEO-, Heartbeat-, Brain- en website-agent erft dit contract.** Tijdens elke bestaande natuurlijke Heartbeat-cyclus:
1. **Observe:** gebruik verse en geverifieerde Search Console, GA4, consent-aware `bg_interacties`, `growth_page_daily`, `growth_events`, `growth_outcomes`, scans, CRM/order/finance en externe onderzoekssignalen. Documenteer meetgaten; NULL is onbekend, niet nul.
2. **Diagnose:** vind aantoonbare drop-off, formulierfrictie, CTA/WhatsApp-hulpbehoefte, lage intent-match, mobiele toegankelijkheid of meetlacunes. Koppel bron-ID, segment, noemer, tijdvenster, betrouwbaarheid en tenant.
3. **Hypothesize:** schrijf toetsbare hypothese/falsifier, customer problem, interventie, baseline, verwacht minimaal relevant effect, primaire omzetgerichte metriek, tijdshorizon, sample-floor, controls, guardrails, rollback, eigenaar en documenteer de datum vóór eerste exposure.
4. **Prioritize:** incrementele betaalde bijdrage (onbekend => UNKNOWN), confidence, reach, effort, kosten, risico en klantwaarde; reserveer exploratieruimte. Geen ongefundeerde impactcijfers.
5. **Experiment:** test `whatsapp_prompt`, `progressive_form`, `contextual_help`, `exit_intent` (desktop-only), `interactive_qualifier`, `roi_calculator`, `scan_followup`, `cta_copy`. Persistente stabiele randomisatie via bestaande `powerhouse_experiment_assignments` vóór treatment; controlegroep; maximaal één relevante prompt per sessie; mobiele dialoog niet blokkerend; sluitbaar en toetsenbordtoegankelijk.
6. **Evaluate:** meetsources en exposurededupe, provider-ID, mature cohorts, datafout/SRM (p<0,001), sample-/power-floor, vooraf vastgelegde primaire KPI, 95%-interval, guardrailregressies (privacy, CLS/INP, SEO, accessibility, formulieren, vertrouwen, betaalde conversie), geen tussentijdse ongecorrigeerde winclaims.
7. **Implement:** winnaar is alleen `CANDIDATE_WIN`. Bestaande BG169/protected merge, Required/BRAIN/CodeQL, exact main→deploy→browser/provider readback en onafhankelijke lead/order/revenue proof zijn nodig; automatische rollback bij regressie.
8. **Learn and remeasure:** registreer positieve, negatieve én onbesliste tests met before/after, beslissing, root cause, bewijs, failed approach, preventie en regressietest. Append via bestaande `powerhouse_cycle_events`→`brain_records` en toon tenant-gescoped in bestaand portaal. Geen alternatieve writer, database, scheduler of extern dispatch-kanaal.

Codecontract: `tools/growth-intelligence/cro-experiment-cycle.mjs` en tests `tools/growth-intelligence/cro-experiment-cycle.test.mjs`; dezelfde bestaande `heartbeat-adapter.mjs` geeft `croOpportunities` en `croLearningProposals` door als voorstellen, **niet** als bewijs van persistente uitvoering. `DESIGN_BLOCKED`, `MEASUREMENT_REQUIRED`, `INCONCLUSIVE` en `INVALID` blijven zichtbaar en mogen niet worden overgeschreven met groen. Bekende meetleemtes krijgen één dedupliceerbare obligation binnen de huidige lineage, waarna agent instrumenteert, test en opnieuw meet.

Onderzoek:
- https://exp-platform.com/Documents/2023-03-11EncyclopeiaMLDSABTestingFinal.pdf
- https://docs.statsig.com/experiments/monitoring/srm
- https://www.optimizely.com/optimization-glossary/ab-testing
- https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials
- https://autoriteitpersoonsgegevens.nl/themas/internet-slimme-apparaten/cookies/trackingcookies

**Release-truth:** deze toevoeging op PR #4901 is `SOURCE_CANDIDATE`; geen productieactivatie, verbetering van conversie of nieuwe orders bewezen totdat exact-head CI, beschermd merge, runtime- en portaal-readback geslaagd zijn.


## Permanente CRO Growth Hacking / Lean experimentatie — 29 oktober 2026

Fingerprint: `powerhouse|cro|evidence-gated-lean-growth-experiment|20261029-v1`.

**Doel:** de bestaande CRO-agent en alle relevante SEO-, Growth Swarm-, Sales-, Content- en Self-Improvement-agents stellen in iedere bestaande Heartbeat-cyclus de vragen: "wat kan beter?", "welke kans zien we?" en "wat is de eerstvolgende meetbare verbetering?" Geen tweede scheduler, experimentcontroller, CRM, geheugen, tenantbrede observatiebus of autonome productie-writer.

**Bestaande runtime- en opslagautoriteit:** `public.bg_interacties` (privacyarme interacties), `public.growth_events`, `public.growth_page_daily`, `public.growth_outcomes`, `public.social_experiments`, `public.powerhouse_experiment_policies`, `public.powerhouse_experiment_assignments` (pre-treatment assignment), `public.powerhouse_decision_cycles`, `public.powerhouse_cycle_events`, `public.brain_records` en de bestaande tenantgebonden portaalprojectie. Hergebruik `tools/growth-intelligence/decision-core.mjs` en `heartbeat-adapter.mjs` via `cro-experiment-cycle.mjs`. Dit is **kandidaatcode** zolang PR #4901 niet door Required/CodeQL, protected merge, Netlify en geauthenticeerde productie-readback is gekomen.

### Verplichte gesloten Lean/PDCA-lus

OBSERVE → DETECT DATA GAP → DIAGNOSE → FIND OPPORTUNITY → HYPOTHESIS + FALSIFIER → PRE-REGISTER → PRIORITIZE → PERSIST ASSIGNMENT → EXPERIMENT → MEASURE + GUARDRAILS → RECONCILE REAL LEADS/ORDERS → DECIDE → PROTECTED IMPLEMENT/ROLLBACK → VERIFY PRODUCTION → LEARN IN ONE BRAIN → NEXT EXPERIMENT.

- **Iedere experimentregistratie** bevat stabiele experiment-/tenant-/pagina-/opportunity-ID, eigenaar, bronlink en versheid, basismeting (of expliciet UNKNOWN), falsifieerbare hypothese, controle en variant, eligibility, exposure-unit, 50/50 allocatie, voorregistratietijd, primaire funnelmetric, guardrails, minimum steekproef en horizon, minimaal praktisch relevant effect, analyse-/stopplan, kosten/risico, rollbackplan en implementatiebevoegdheid. Onbekend is **niet** nul.
- **Kansscore:** verwachte *incrementele betaalde marge* × bewijsbetrouwbaarheid × toepasbaarheid ÷ (inspanning + risico). De score is een prioriteitshypothese, nooit een voorspelling met resultaatstatus.
- **Experimentoppervlakken:** WhatsApp-click-to-chat (geen auto-bericht), dynamische/progressieve formulieren, scan-follow-up met vrijwillige opt-in, contextuele hulp, klik- en scrollgebaseerde hulp, desktop exit-intent, interactieve keuzehulp, ROI-calculator en CTA/prijs-/bewijshiërarchie. Start niet met een opdringerige mobiele overlay; alle prompts zijn wegklikbaar, keyboard-accessible en maximaal eenmaal per sessie.
- **Kwaliteitscontract:** eerst een verse geverifieerde basismeting en privacy-grondslag; persistente toewijzing *vóór* treatment, stabiele exposure-id, gelijk gedefinieerde exposure in beide armen, dedupe, uitsluiting van bots, consent-aware tracking, geen identificerende inhoud in analytics of LLM-prompts. Meet control en treatment apart.
- **Experimentanalyse:** controleer sample-ratio-mismatch en dataschade, vooraf bepaald analysemoment, minimaal aantal per arm, uitkomstbewijs, betrouwbaarheidsinterval en praktisch relevant effect. Bij te weinig events, SRM, peeking, onrijpe outcome-attributie of onbekende steekproef: INCONCLUSIVE/INVALID, nooit WIN. Fixed-horizon p<0,05 is alleen een kandidaat-besluit bij voldoende steekproef en valide aannames; steekproefvloer is geen statistische powergarantie.
- **Primair zakelijk resultaat:** gekwalificeerde lead → afspraak → offerte → betaalde order → onafhankelijk geverifieerde omzet. Een WhatsApp-knopklik of formulierstart is hoogstens een microconversie. Retouren/annuleringen en werkelijke kosten tellen mee voordat een commerciële verbetering "bewezen" is.
- **Veilig implementeren:** een `CANDIDATE_WIN` betekent alleen een geprioriteerde, omkeerbare wijziging voor BG169 / Required + CodeQL + portal/SEO/accessibility/consent tests, protected merge, Netlify readback en onafhankelijke klantuitkomst. Dit is nooit een automatische deploy, echte bestelling of gerealiseerde omzet. Regressie geeft STOP + rollback van alleen de betreffende variant. Respecteer bestaande budget-/writer-gates en menselijke goedkeuring waar nodig.
- **Lerend geheugen:** schrijf zowel positieve, negatieve, mislukte als onbesliste experimenten via de bestaande idempotente event/Brain/learning-route; leg blootstelling, hypothese, beslismoment, effect, oorzaak, kosten, regressietest, prevention rule en volgende actie vast. Synchroniseer pas naar de juiste tenant-portalweergave na werkelijke write/readback; geen nieuwe learning-store. Iedere andere agent mag deze historische lessen hergebruiken in zijn volgende beslissing.

### Eerste experimentportfolio
1. Frisse Blik-uitkomst → vrijwillige vervolgactie versus huidige pagina, gekwalificeerde leads als primaire metric; niet de gratis scan blokkeren of zonder toestemming contactdata vastleggen.
2. AFAS/Exact/Power BI money page → contextuele WhatsApp-hulp versus gewone CTA. Verifieer werkelijke gesprekken/gekoppelde aanvragen, niet alleen click-outs.
3. Lange formulieren → progressief formulier versus huidige versie, succesvolle *gekwalificeerde* aanvragen en afhaakreden.
4. Prijzenpagina → desktop exit-intent met nuttige keuzehulp versus geen overlay, guardrails voor toegankelijkheid, irritatie, SEO en orders.
5. ROI-berekening → transparante calculator versus statische uitleg, zonder verzonnen besparingen.

### Evidence en bronnen
- Microsoft ExP / SRM: https://www.microsoft.com/en-us/research/articles/alerting-in-microsofts-experimentation-platform-exp/
- Statsig fixed-horizon versus sequential peeking: https://docs.statsig.com/experiments/advanced-setup/sequential-testing
- Eppo statistical plan/guardrails: https://docs.geteppo.com/administration/setting-statistical-analysis-plan-defaults/
- Google intrusive overlays: https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials
- NL tracking cookie consent: https://www.rijksoverheid.nl/themas/economie/telecommunicatie/veilig-gebruik-internet/vraag-en-antwoord/telecommunicatie/mag-een-website-ongevraagd-cookies-plaatsen

### Verplichte release-regressie
`tools/growth-intelligence/cro-experiment-cycle.test.mjs`; plus bestaande `tools/growth-intelligence/heartbeat-adapter.test.mjs` en `tests/brain-growth-intelligence-delivery-closure.test.mjs`. Controleer daarna in productie dat de bestaande Heartbeat een daadwerkelijk geregistreerde toewijzing/exposure/outcome/learning afhandelt en dat portal tenantisolatie en geauthenticeerde readback slagen. Tot dat bewijs: `CODE_CANDIDATE_NOT_LIVE`.


## Eén gezamenlijke groeisturing — 30-10-2026
De oorspronkelijke CRO-API projectie `POWERHOUSE_COMPOUND_IMPROVEMENT_READONLY_V1` toont alleen wat de bestaande Revenue/Content/Portal/Heartbeat-bronnen bewijzen. De bestaande Growth Swarm verifieert vóór iedere geautoriseerde next-best-action de echte provider-CTA, consent, bronversheid, bestaande commerciële lead/quote/payment-ID, tenant en laatst toegepaste social/revenue learning. Prioriteit: betaalde orders, vervolgens gekwalificeerde klantwaarde, CTA en pas daarna likes. 0 sociale leertoepassingen in zeven dagen is onvoldoende bewijs van autonomiestijging; schrijf bij volgende natuurlijke run uitsluitend echte application/evaluation terug, nooit geconstrueerde stats of een extra post. Bij ontbrekende klantportaalcohort, event-ID of feedback: handhaaf `CUSTOMER_VALUE_OUTCOME_EVIDENCE_DUE` en laat de originele product-CRO-eigenaar de meetdekking en gecontroleerde verandering oplossen. Bij externe provider- of betaalbewijsproblemen: geen nieuw kanaal/writer. ONE BRAIN fingerprint `powerhouse|compound-organism|connected-not-proven-daily-value|20261030-v1`; test `tests/brain-compound-revenue-portal-learning-proof-20261030.test.mjs`.


## Zelfstandig commerciële technologie ontwikkelen — Autonomous Agent Innovation V1
Contract `POWERHOUSE_AGENT_AUTONOMOUS_INNOVATION_V1`. Originele Growth Swarm kiest dagelijks op echte consented CRO, 30d klanten/orders, provider-readback, social/e-mail toepassing en originele ONE BRAIN-lus zelf de meest kansrijke **meetbare** commerciële interventie. De bestaande agent mag zelfstandig een gerichte buyer-problem-search, privacyveilige CTA/referentiepagina, onderbouwde value-first offer of omzet-attributiefix ontwikkelen en via originele protected PR → Required/CodeQL → exact main/Netlify READY live zetten, zolang legaal/consent, budget, bronkwaliteit, contactdruk en exclusieve writer aantoonbaar akkoord zijn. Experimentcontrole en bron-/providerbetaling blijven onafhankelijk; fail closed wanneer baseline of echte lead-ID ontbreekt. Nieuwere AI-tools/modellen eerst vergelijken met de huidige oplossing op brongetrouwheid, doelgroepfit, snelheid, kosten, veiligheid en eigen taakresultaat. Geen tweede publisher/scheduler, geen duplicate outreach, geen verzonnen 30d orders of gemanipuleerde marketingcijfers. Leg origineel prioriteits-ID, eigenaar, change, tests, uitkomst en next-run leerregel vast in ONE BRAIN/Heartbeat; pas na echte verhoging betaalde klantwaarde mag een winnaar gepromoveerd worden. Zie `tests/brain-autonomous-innovation-portfolio-20261030.test.mjs`.


## One original commercial growth-to-paid-order loop — 30-10-2026
Use `POWERHOUSE_ONE_BRAIN_COMMERCIAL_FUNNEL_V1` via protected original `compoundImprovement` and `commercialGrowthFunnel` owner-only portal/API before every existing natural Growth Swarm intervention. Original social engagement (views, likes, comments, shares/reposts), opted-in email replies, source-backed website visitors, real persisted CTA event_id, consented qualified leads, and independently paid order ID must each retain separate source ages, provider identity and confidence. Pick earliest proven source-break from `commercialGrowthFunnel.priorities` (prioritized CTA producer→202→original drain→persisted readback when unknown). Test actual source attribution and controlled CRO holdout. Within original authority autonomously implement safe bounded repairs through protected PR and exact Netlify readback, measure incremental paid orders and actual customer task value, update ONE BRAIN fingerprint, skills, humans and portal on next natural execution. Never send an extra email/social post, infer one social liker is a buyer, mix cohorts, replace original publisher, call 0 events true 0 user interest, or claim daily rising traffic/order guarantee. Fingerprint `powerhouse|one-brain|growth-funnel-observed-engagement-not-attributed-sales|20261030-v1`; `tests/brain-commercial-growth-funnel-closed-loop-20261030.test.mjs`.


## Original CRO CTA writer handoff into buyer conversion (30-10-2026)
Fingerprinted original source gap `powerhouse|cro|seo-generated-cta-owner-route-parity-gap|20261030-v1`: generated page owner now recognizes all six first-party in-main contact/signup/pricing/scan/checkout CTA routes without the global duplicate writer. The Growth/Revenue agent must not count route coverage as a customer lead or sale: verify actual persisted original primary_cta_click event ID, correlate consented source→opt-in lead→provider-paid order, then implement safe controlled CTA copy/UX after actual readback and attribute verifiable business value. User content/visitor/recipient tracking privacy, provider ID, exclusive writer, no extra emails/posts/schedulers, original 15-loop guards, model champion/challenger and protected exact-SHA release remain binding. Preserve real learning applied on next natural run in original ONE BRAIN + Heartbeat and portal; no fantasy rising percentages.
