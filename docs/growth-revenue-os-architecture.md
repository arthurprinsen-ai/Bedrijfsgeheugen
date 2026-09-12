# Growth Revenue OS — canonieke architectuur

**Architectuur-ID:** `growth-revenue-os-architecture-v1`  
**North star:** EUR 1.000.000 aantoonbaar toegeschreven omzet uiterlijk 2027-09-12.  
**Status:** canoniek operating contract.

## 1. Doel
Bedrijfsgeheugen wordt dagelijks beter in het ontdekken, voorspellen en converteren van echte marktvraag naar omzet. Het systeem optimaliseert niet op datavolume of vanity metrics, maar op beter gekalibreerde conclusies en aantoonbare commerciële uitkomsten.

## 2. Niet-onderhandelbare principes
- Eén canoniek data- en leersysteem; geen parallel CRM, analytics brain of shadow store.
- Belangrijke conclusies ontstaan uit cross-source fusion, niet uit één losse databron.
- Fact, inference, hypothesis, prediction, outcome en learning blijven onderscheiden.
- Een promotable learning vereist een voorspelling vóórdat de uitkomst bekend is.
- Negatief en tegenstrijdig bewijs wordt bewaard.
- Kennis kan promoveren, blijven staan, afwaarderen, verlopen of worden verwijderd.
- Geen verzonnen omzet, attributie, urgentie, schaarste, identiteit of causaliteit.
- `live`, `fixed`, `learned` en `done` vereisen execution/readback evidence.

## 3. Architectuurlagen
### 3.1 Bronnen
Externe markt- en onderzoeksdata, branche- en bedrijfscontext, Search/SEO, LinkedIn persoonlijk en bedrijf, Instagram, blogs, website, anonieme interacties, geïdentificeerde connecties/leads waar rechtmatig, salesacties, offertes, orders en omzet.

### 3.2 Canonieke opslag
Bestaande tabellen blijven leidend, waaronder `growth_events`, `growth_brain_queue`, `growth_page_daily`, `bg_interacties`, `bg_zoekprestaties`, `bg_zoekwoordkansen`, `bg_externe_signalen`, `instagram_growth_research_sources`, `social_posts`, `social_metric_snapshots`, `social_experiments`, `social_learning_evaluations`, `social_learning_obligations`, `social_learnings`, `revenue_learning_evidence`, `revenue_learning_obligations`, `revenue_learnings`, `growth_outcomes`, `powerhouse_sales_outcomes`, `bg_connecties`, `bg_connectiescore`, `linkedin_engagement_events`, `powerhouse_opportunities`, `powerhouse_sales_actions`, `powerhouse_sales_learnings`, `powerhouse_content_recommendations` en `brain_records`.

### 3.3 Relationship graph
`marktverandering → branche → bedrijfskenmerk → rol → latent probleem`

`probleem → zoekvraag → onderwerp → contentmechanisme → kanaal`

`content → engagementactor → bedrijf/context → cockpitactie`

`actie → gesprek → lead → offerte → order → omzet`

`voorspelling → echte uitkomst → fout/calibratie → learning → volgende voorspelling`

## 4. Intelligence Fusion
Het systeem zoekt actief naar niet-zichtbare kruisingen, anomalieën, leading indicators, tweede-orde-effecten, timing windows en onderbediende narratieven. Voor materiële nieuwe inzichten worden waar mogelijk minimaal drie onafhankelijke evidence-typen gecombineerd. Iedere conclusie behoudt source lineage, confidence, novelty, commerciële relevantie en een falsifier.

## 5. Prediction → Outcome → Calibration
Voor iedere materiële hypothese of actie wordt vooraf vastgelegd: doelgroep/bedrijf/context, verwachte metric of commerciële fase, tijdshorizon, probability/confidence, evidence lineage, causale redenering, falsifier en verwachte commerciële waarde.

Daarna ontstaan evaluatieverplichtingen voor 24 uur, 72 uur, 7 dagen en waar nodig langere saleswindows. Alleen geobserveerde outcomes mogen de voorspelling beoordelen. Het systeem berekent prediction/calibration error, bewaart false positives/negatives en verlaagt confidence bij tegenbewijs.

## 6. Learning lifecycle
`candidate → tested → calibrated → promoted/held/demoted/retired`

Een learning wordt alleen duurzaam wanneer bewijs sterk of herhaald genoeg is én de calibratie acceptabel is. Structureel slechte voorspellers verdwijnen uit de actieve beslislaag. Het Brain wordt dus niet alleen groter; het vergeet bewust zwakke of verouderde kennis.

## 7. Uitvoering
Gerangschikte opportunities worden omgezet in passende content-, SEO-, blog-, experiment- of cockpitacties. Kanaalidentiteiten blijven gescheiden:
- **LinkedIn persoonlijk:** echte Arthur-stem; geen verzonnen first-person gebeurtenissen.
- **LinkedIn bedrijf:** Gewoon Even B.V.-universum; problemen nooit presenteren als interne Bedrijfsgeheugen-fouten.
- **Instagram:** Mira als daily-life character/IP; OpenArt voor Reels/video, Placid voor static/carousel; geen verplichte businessmoraal.
- **Blog/website:** evidence-led demand/search/conversion assets met SEO-, interaction- en commerciële lineage.

## 8. Engagement → cockpit → revenue
Platformactoren worden alleen opgeslagen wanneer de bron/API ze daadwerkelijk exposeert en verwerking rechtmatig is. Aggregate-only blijft aggregate. Eén like is zwak intent en veroorzaakt nooit automatisch een ongevraagde DM. Hogere intentie kan proportioneel doorstromen via review, publieke reactie, connectie/follow, gepersonaliseerde benadering, gesprek, lead en offerte.

## 9. Persuasion en FOMO
Het systeem mag latent probleemherkenning, opportunity cost, contrast, bewijs en reële timing gebruiken. FOMO is alleen toegestaan bij verifieerbare schaarste, marktbeweging, timing of opportunity cost. Geen verzonnen angst, urgentie, populariteit, testimonials of verborgen risico's.

## 10. Dagelijkse autonome cyclus
1. Lees deze architectuur en actieve Brain-regels.
2. Ingest alleen nieuwe/gewijzigde interne en externe evidence.
3. Update relationship graph en cross-source signals.
4. Rangschik nieuwe insights/opportunities.
5. Leg predictions vooraf vast met confidence en falsifier.
6. Voer hoogste veilige verwachte-waarde acties uit.
7. Verifieer publish/deploy/live readback.
8. Verwerk vervallen 24h/72h/7d/sales obligations.
9. Vergelijk voorspelling met geobserveerde uitkomst.
10. Recalibreer confidence; promote/hold/demote/retire.
11. Schrijf Intelligence Scorecard.
12. Bereken omzetgap en vereiste pace naar EUR 1M.
13. Gebruik alleen gekalibreerde learnings in de volgende run.

## 11. Intelligence Scorecard
Minimaal: prediction accuracy, calibration error, false-positive rate, false-negative rate waar meetbaar, nieuwe cross-source relaties, gevalideerde inzichten, tegengesproken/verwijderde learnings, qualified-lead conversion, offer conversion, order conversion, attributable revenue, revenue per insight en revenue per content/action.

## 12. Failure recovery
Missing data, failed publication/deploy, ontbrekende readback, overdue calibration of stale learning creëert een open recovery obligation. Pause/disable/quarantine is containment, geen completion. Recovery vereist root cause, minimale veilige fix, regressietest, readback, veilige heractivatie en prevention/writeback.

## 13. Governance
Geen destructieve data-acties, secrets/permissiewijzigingen, security-verzwakking, autonome verhoging van betaalde resources, bulkspam, fake personalization of autonoom juridisch/financieel bindende acties buiten de toegestane grenzen.

## 14. Definitie van 'werkend'
De architectuur is pas operationeel als het Brain-record verified/readable is, dit repositorydocument op de bedoelde branch terugleesbaar is, de dagelijkse agent dit contract vooraf leest, echte runs prediction/outcome/calibration evidence produceren en intelligence-scorecards aantonen of de kwaliteit werkelijk verbetert.

Een grotere database is **geen** bewijs dat het systeem slimmer is. Alleen betere voorspellingen, betere calibratie en betere commerciële uitkomsten tellen als verbetering.
