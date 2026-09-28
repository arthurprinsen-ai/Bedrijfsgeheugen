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
- Ongevraagde externe outreach blijft human-authorized; deze skill verstuurt niets zelfstandig.
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
Per cycle maximaal 50 research-selecties en 20 activation reviews. Research is intern. Activation review vereist bestaande economische/opportunity-evidence én menselijke autorisatie voor extern contact.

## Learning
Meet research -> validated trigger, activation review -> contact, contact -> reply, reply -> meeting, meeting -> scan, scan -> order en realized revenue. Schrijf uitkomsten terug naar dezelfde canonical sales/outcome/forecast lineage zodat scoring zichzelf kalibreert.


## Automatische research execution
Fingerprint: `powerhouse-relationship-research-auto-enrichment-v1`.

De commerciële cyclus voert research nu zelf uit tegen bestaande publieke Powerhouse-bronnen: `bg_bedrijfsnieuws`, `bg_externe_signalen` en `powerhouse_predictive_signals`. Alleen een echte evidence-match wordt als `VERIFIED` runtime event teruggeschreven. Geen match blijft zonder verzonnen trigger staan en kan in een latere cyclus opnieuw worden onderzocht nadat de bestaande nieuws/signaal-ingest nieuwe evidence heeft aangevoerd.

De volgorde in dezelfde scheduler is: relationship ranking -> research execution -> trigger acquisition -> commercial learning. Geen aparte cron toevoegen.


## Autonome research-uitvoering
De engine stopt niet bij een research-queue. `public.powerhouse_execute_relationship_research_v1(date)` hergebruikt bestaande Powerhouse-evidence. Wanneer die ontbreekt dispatcht `public.powerhouse_dispatch_relationship_public_research_v1(date)` de Edge Function `powerhouse-relationship-public-research` vanuit dezelfde bestaande commerciële scheduler. Deze worker zoekt bounded publieke SERP-evidence via de bestaande DataForSEO-credentials, schrijft alleen gevonden evidence terug naar `powerhouse_runtime_events` en triggert daarna de bestaande MKB-triggerrefresh. Geen tweede scheduler, geen Apollo-afhankelijkheid en geen externe outreach.
