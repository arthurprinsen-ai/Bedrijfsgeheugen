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

## 15. Dagelijks content-executioncontract
**Contract-ID:** `powerhouse-daily-execution-contract-v1`.

Iedere kalenderdag krijgt exact één expliciete beslissing voor elk van deze zeven kanalen:
1. `email_newsletter`
2. `linkedin_personal`
3. `linkedin_company`
4. `linkedin_article_personal`
5. `linkedin_article_company`
6. `instagram_company`
7. `blog`

Per kanaal is de beslissing `publish`, `skip` of `hold`. Stilzwijgend niets doen is ongeldig. De beslissing, prioriteit, confidence, onderwerp, rationale, geplande tijd en evidence worden vastgelegd in `powerhouse_channel_decisions`. Gegenereerde content staat in `powerhouse_content_artifacts`. Het bestaande `social_posts` blijft de provider-readback voor sociale publicaties; de approved-central Notion-blogqueue en GitHub candidate-PR-writer blijven de canonieke blogdelivery.

Een dagrun mag uitsluitend `completed` zijn wanneer alle zeven kanalen een expliciete beslissing hebben én iedere `publish`-beslissing aantoonbare delivery-evidence heeft. Anders wordt de run fail-closed `degraded`. Een scheduler-ack, concept, aanbeveling of AI-output is nooit publicatiebewijs.

## 16. Productieketen en verantwoordelijkheden
De dagelijkse keten is:

`signalen/data → powerhouse-runtime → powerhouse-content-orchestrator → powerhouse_channel_decisions → contentgeneratie → pre-publish gate → providerdelivery → providerreadback → metrics/outcomes → learning/calibratie → volgende run`

### Beslislaag
`powerhouse-content-orchestrator` is decision-only. Hij bepaalt dagelijks voor alle zeven kanalen `publish|skip|hold` en bewaakt downstream-capability: een kanaal mag niet autonoom op `publish` worden gezet als er geen toegestane executor voor bestaat.

### Sociale delivery
`powerhouse-social-publisher` verwerkt alleen ondersteunde, content-ready `publish`-beslissingen. Vóór Buffer wordt `bg-pre-publish-review` verplicht uitgevoerd. Geblokkeerde identiteit, ontbrekende meetlink of andere hard-gate-overtreding wordt als `blocked` opgeslagen en niet gepubliceerd. Buffer delivery-ID en due-time worden teruggeschreven als evidence. `bg-buffer-sync` verzorgt providerreadback en metricsynchronisatie.

### Blogdelivery
`approved-central-blog.yml` en `scripts/publish_approved_blog_v2.py` blijven de bestaande blogauthority. De writer accepteert uitsluitend een exact goedgekeurde slug uit de approved-central queue, draait deterministische checks, maakt een candidate branch/PR en laat BG169/CI/productie-readback beslissen over productie. Er is geen directe push naar `main` vanuit de contentbeslislaag.

### Execution guard
`powerhouse_daily_execution_guard()` reconcilieert de werkelijke dagstatus. `powerhouse_execution_status(date)` berekent onder meer alle beslissingen, open publish-acties en delivery-completion. De hourly guard degradeert onterechte `completed`-runs en kan alleen promoveren wanneer het contract aantoonbaar compleet is.

## 17. Kanaalidentiteit en publicatiegates
Het canonieke hard-gatecontract is `channel-identity-hard-gate-v2`, fail-closed.

- LinkedIn persoonlijk Buffer-kanaal: `6a70381699afb44349f0fb35`.
- LinkedIn bedrijf Buffer-kanaal: `6a70381699afb44349f0fb36`.
- Instagram `bedrijfsgeheugen.nl`: `6a70384d99afb44349f0fba9`.
- Persoonlijk Instagram is niet gekoppeld en mag daarom niet autonoom publiceren.

LinkedIn persoonlijk mag zakelijk zijn, maar moet kanaalnative Arthur-copy blijven en mag geen verzonnen first-person ervaring bevatten. LinkedIn bedrijf blijft merk/expertise/marktgedreven. Instagram bedrijfsgeheugen.nl blijft Mira-IP. Een verkeerde kanaalidentiteit is een harde stop, geen waarschuwing.

## 18. Scheduler- en releasecontract
De productieplanning gebruikt bestaande scheduler- en syncpaden; er wordt geen parallel publicatiesysteem naast gebouwd. Beslissen, publiceren en readback zijn afzonderlijke verantwoordelijkheden zodat een aanbeveling nooit nog als uitvoering kan worden geteld.

De approved-central blogworkflow is een **automation-only delivery lane**. Een wijziging uitsluitend aan `.github/workflows/approved-central-blog.yml` mag daarom automation-tests vereisen, maar geen irrelevante Netlify website-preview. Control-plane workflows zoals `.github/workflows/required-test.yml` blijven daarentegen bewust shared executable en fan-out naar alle relevante release-lanes. Dit onderscheid is afgedwongen met regressietest `approved central blog workflow is automation-only and does not require a website preview`.

## 19. Recovery- en bewijsregels
Bij iedere dagelijkse run gelden deze invarianten:
- `suggested` of `content_ready` is geen delivery.
- `scheduled` telt alleen als provider-ID en due-time terugleesbaar zijn; na het geplande tijdstip is echte providerreadback vereist om publicatie te bewijzen.
- `published` zonder providerreadback of publieke/live evidence is ongeldig.
- Een fout creëert een recovery obligation en blijft zichtbaar totdat root cause, regressie, uitvoering en readback aantoonbaar gesloten zijn.
- Fallbacks mogen bestaande hard gates nooit omzeilen.
- Make-pauze/limieten zijn containment; ze mogen geen succesvolle Brain-writeback simuleren.

## 20. Operationele waarheid
De operationele waarheid wordt bepaald door execution evidence, niet door agenttekst. Voor een contentdag moeten daarom minimaal terugleesbaar zijn: zeven kanaalbeslissingen, artefacten voor gekozen `publish`-kanalen, pre-publish gate-uitkomst, provider-/writer-deliveryref, provider/live readback, meetgegevens en opvolgende learning/calibratie. Alleen die gesloten keten rechtvaardigt de status `completed`.

## 21. Release-learning en regressiepreventie
**Contract-ID:** `release-learning-closed-loop-v1`.

Iedere releasefout levert blijvende preventie op in dezelfde canonieke keten. Minimaal gelden de volgende regels:
- Branch drift tijdens een actieve reparatie wordt nooit opgelost met een geforceerde ref-update. De nieuwste head wordt eerst opnieuw gelezen en geïntegreerd; geen tussentijdse wijziging mag verloren gaan.
- Conflict-resolutie wordt inhoudelijk gecontroleerd op verdwenen hard gates. Een merge die technisch mergeable is maar een releasecontract verliest, geldt als defect en krijgt een regressietest vóór verdere promotie.
- Een lokale exact-candidate fallback bewijst alleen bereikbaarheid wanneer clean URLs werken. Hij mag nooit websitekwaliteitsgates vervangen of verlagen.
- De Required website-lane blijft volledige public-page visibility controleren, inclusief CLS. `CLS > 0.100` op enig gecontroleerd viewport blijft fail-closed en moet exacte route + viewport als evidence rapporteren.
- Een eerdere blocker die groen wordt, beëindigt de diagnose niet automatisch. Daarna ontstane of zichtbaar geworden fouten worden als nieuwe root-cause-obligation behandeld en niet als reden om checks te omzeilen.
- Een release mag pas worden gemerged nadat de **laatste** candidate SHA de relevante Required-lanes groen heeft doorlopen. Groen bewijs van een oudere SHA is ongeldig voor completion.

### Incident learning — PR #1452
Tijdens de integratie van de unified content calendar werden drie aparte failure classes zichtbaar:
1. branch drift maakte een eerder voorbereide ref-update terecht non-fast-forward;
2. een conflict-resolutie verloor tijdelijk de `requires_preview`-scheiding in de website-lane;
3. nadat clean-URL fallback en routechecks groen waren, vond de volledige visibility-gate negen echte CLS-overschrijdingen op phone/tablet (`0.111–0.154`, limiet `0.100`).

De structurele learning is daarom: **fix nooit alleen de eerst zichtbare blocker; behoud alle downstream kwaliteitsgates en laat de volledige keten opnieuw beslissen op de nieuwste SHA.**


## 22. SEO Opportunity Intelligence
**Contract-ID:** `powerhouse-seo-opportunity-resolver-v1`.

SEO is part of the canonical Powerhouse opportunity/prediction system, not a standalone content calendar. The daily evidence chain is:

`GSC → DataForSEO cache → external market forecasts → bounded live enrichment → intent-owner decision → forecast → recommendation/action → existing protected delivery → outcome/calibration`.

The resolver runs after the daily DataForSEO and Search Console syncs and before the canonical morning blog delivery window. It ranks at most five Dutch search opportunities using search demand, CPC, ranking gap, current GSC evidence, whitespace and external forecast evidence.

A zero-item live DataForSEO producer run proves connectivity only. It never invalidates still-fresh cached keyword intelligence. This distinction is mandatory because producer liveness and market-data availability are separate truths.

The decision gate is deterministic:
- existing canonical owner: `UPDATE_MONEY_PAGE`;
- no owner + commercially material and externally supported distinct gap: `CREATE_INTENT_GAP_CONTENT`;
- otherwise: `NO_ACTION_EVIDENCE_INSUFFICIENT`.

Only the second state can create a blog recommendation. It enters `powerhouse_content_recommendations`, after which the existing Powerhouse content orchestrator, blog queue, GitHub candidate PR, protected merge and public readback remain authoritative. There is no second publisher.

Every material search opportunity is first written as a forecast in `powerhouse_forecasts`. CPC, volume, first-mover score and modeled probability are prioritization evidence, never booked or attributable revenue. Subsequent GSC, CTA, lead, order and revenue outcomes calibrate whether the first-mover thesis was correct.
