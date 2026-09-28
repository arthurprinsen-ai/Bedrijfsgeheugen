# Skill: Powerhouse Relationship Revenue

Fingerprint: `powerhouse-relationship-revenue-engine-v1`

## Doel
Activeer de bestaande relatie- en bedrijfsgraph als commerciële asset richting eerste betaalde order en gerealiseerde omzet, zonder een parallel CRM of externe vendor als brein te introduceren.

## Canonieke bronvolgorde
1. **Powerhouse first-party**: `bg_connecties`, person/company intelligence, runtime events, opportunities, actions, outcomes, forecasts en learnings.
2. **Publieke web-evidence**: bedrijfswebsite/newsroom, vacatures, publieke nieuws- en marktbronnen en publiek toegankelijke LinkedIn/company context waar dat rechtmatig en technisch toegestaan is.
3. **Optionele vendor fallback**: Apollo, Lusha, ZoomInfo of vergelijkbaar alleen wanneer een concreet bewijs- of contactdatagat na stap 1 en 2 overblijft.

Externe vendors zijn nooit canonical truth, nooit vereist voor de dagelijkse loop en nooit eigenaar van scoring of next-best-action.

## Beslisregels
- Relatiewarmte is **geen kooptrigger**.
- Gebruik bestaande relatie-, beslissers-, company-intent-, recency- en outcome-evidence om research te prioriteren.
- Maak bij onvoldoende actuele evidence een `research_enrichment` actie op kanaal `internal`.
- Alleen wanneer reeds echte opportunity-/waarde-evidence bestaat, mag een `commercial_outreach_review` worden voorbereid.
- Autonome outbound is door de gebruiker expliciet geautoriseerd voor bestaande relaties wanneer fresh evidence, suppression, cooldown en kanaalvalidatie groen zijn.
- Geen scraping, platform-bypass, bulk-DM of generieke pitch.
- Dedupe acties en respecteer fatigue/suppression.
- Optimaliseer voor paid order en realized revenue, niet voor aantallen leads of berichten.

## Runtime authority
- View: `public.powerhouse_relationship_revenue_intelligence_v1`.
- Refresh: `public.powerhouse_refresh_relationship_revenue_v1(date)`.
- Bestaande dagelijkse owner: `powerhouse-commercial-learning-v1` via `public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)`.
- Volgorde: relationship revenue -> trigger acquisition -> commercial learning.
- Geen tweede scheduler, CRM, action queue of learning store.

## Bounded execution
Per cycle maximaal 50 research-selecties en 20 activation reviews. Research is intern. Externe opvolging mag autonoom via een ondersteund kanaal wanneer de relatie- en evidence-gates groen zijn. Handmatige goedkeuring per bericht is niet vereist.

## Learning
Meet research -> validated trigger, activation review -> contact, contact -> reply, reply -> meeting, meeting -> scan, scan -> order en realized revenue. Schrijf uitkomsten terug naar dezelfde canonical sales/outcome/forecast lineage zodat scoring zichzelf kalibreert.


## Automatische research execution
Fingerprint: `powerhouse-relationship-research-auto-enrichment-v1`.

De commerciële cyclus voert research nu zelf uit tegen bestaande publieke Powerhouse-bronnen: `bg_bedrijfsnieuws`, `bg_externe_signalen` en `powerhouse_predictive_signals`. Alleen een echte evidence-match wordt als `VERIFIED` runtime event teruggeschreven. Geen match blijft zonder verzonnen trigger staan en kan in een latere cyclus opnieuw worden onderzocht nadat de bestaande nieuws/signaal-ingest nieuwe evidence heeft aangevoerd.

De volgorde in dezelfde scheduler is: relationship ranking -> research execution -> trigger acquisition -> commercial learning. Geen aparte cron toevoegen.


## Autonome research-uitvoering
De engine stopt niet bij een research-queue. `public.powerhouse_execute_relationship_research_v1(date)` hergebruikt bestaande Powerhouse-evidence. Wanneer die ontbreekt dispatcht `public.powerhouse_dispatch_relationship_public_research_v1(date)` de Edge Function `powerhouse-relationship-public-research` vanuit dezelfde bestaande commerciële scheduler. Deze worker zoekt bounded publieke SERP-evidence via de bestaande DataForSEO-credentials, schrijft alleen gevonden evidence terug naar `powerhouse_runtime_events` en triggert daarna de bestaande MKB-triggerrefresh. Geen tweede scheduler, geen Apollo-afhankelijkheid en geen externe outreach.


## Productieplanning
De live Edge Function `powerhouse-relationship-public-research` wordt vanuit dezelfde bestaande `powerhouse-commercial-learning-v1` cyclus gedispatcht. De canonical scheduler blijft de enige scheduler-owner. Geen tweede cron, geen tweede brein en geen losse commerciële schedulerfamilie.


## Terminal production proof — 28 september 2026

Status: `LIVE_PROVEN`.

Protected main bevat merge `35f465c613cdc32f37f0dd2810e86ceb1518be08` van PR #3155. Productie-readback bevestigt:
- 2.105 relaties boven de researchdrempel;
- 10 actuele public-research events;
- 10 evidence-backed trigger-opportunities;
- 8 afgeronde relationship-research acties;
- Edge Function `powerhouse-relationship-public-research` ACTIVE;
- exact één scheduler-owner: `powerhouse-commercial-learning-v1`;
- nul parallelle relationship-research crons;
- `apollo_required=false`;
- autonome externe outreach was in deze historische production proof nog niet actief; de opvolgende autonomous-outreach skill vervangt die beperking.

Daarmee is de vaste regel: Powerhouse is het sales-intelligencebrein; publieke webdata is evidence-input; externe commerciële databrokers zijn alleen optionele fallback en nooit authority.


## Autonome outbound
Fingerprint: `powerhouse-autonomous-relationship-outreach-v1`.

Powerhouse mag zelf commerciële opvolging uitvoeren zonder per bericht opnieuw menselijke goedkeuring te vragen, maar alleen binnen harde grenzen:
- uitsluitend bestaande relaties met status `in_gesprek`, `aangeboden` of `rust`;
- alleen bij een verse evidence-backed trigger van maximaal 30 dagen oud met confidence >= 0,60;
- maximaal 5 autonome sends per dag;
- maximaal 1 succesvolle e-mail per persoon per 30 dagen;
- `unsubscribe`, `opt_out`, `do_not_contact`, `complaint` en `negative_reply` blokkeren automatisch vervolgcontact;
- provider acknowledgement moet bestaan voordat een actie `done` wordt;
- dedupe/republish-forbidden voorkomt dubbele verzending;
- Gmail via de bestaande Composio-verbinding is het ondersteunde primaire kanaal;
- LinkedIn DM wordt alleen gebruikt wanneer een daadwerkelijk ondersteunde DM-capability beschikbaar en geverifieerd is; nooit een niet-bestaande capability simuleren.

Runtime: `public.powerhouse_prepare_autonomous_outreach_v1(date)` -> `public.powerhouse_dispatch_autonomous_outreach_v1(date)` -> Edge Function `powerhouse-autonomous-outreach`. De bestaande `powerhouse-commercial-learning-v1` blijft enige scheduler-owner.


## LinkedIn sales machine
Gebruik `powerhouse-linkedin-sales-machine-v1` als sociale commerciële laag vóór of naast private outreach. Een concrete relevante LinkedIn-post kan een contextuele commenttouch krijgen; geaggregeerde triggerpatronen voeden `linkedin_company` als sales-air-cover; inbound engagement wordt intent-evidence. LinkedIn DM wordt nooit gesimuleerd wanneer de provider geen send-DM capability heeft. In dat geval blijft e-mail de private fallback. Bij een geslaagde LinkedIn-comment wacht private e-mail 24 uur.
