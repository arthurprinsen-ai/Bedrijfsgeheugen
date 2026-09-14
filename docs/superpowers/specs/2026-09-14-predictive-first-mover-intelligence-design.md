# Predictive First-Mover Intelligence v1 — Design

## Doel
Bedrijfsgeheugen/Powerhouse moet systematisch eerder dan de markt signaleren wat relevant gaat worden, daar aantoonbare forecasts van maken, first-mover contentclaims aan koppelen, commerciële uitkomsten meten en de voorspellingen dagelijks kalibreren. Het commerciële hoofddoel is €1.000.000 gerealiseerde omzet uiterlijk 14 september 2027.

Canoniek contract: `predictive-first-mover-intelligence-v1`.
Revenue operating contract: `growth-revenue-os-1m-2027-v1`.
Channel identity contract: `channel-identity-hard-gate-v2`.

## Principes
1. Geen parallel intelligence- of publicatiesysteem naast de bestaande Powerhouse-keten.
2. Predictive Intelligence komt vóór `powerhouse-content-orchestrator` en voedt de bestaande dagelijkse beslislaag.
3. Forecasts worden vooraf vastgelegd met probability, confidence, horizon en evidence. Achteraf gelijk claimen is verboden.
4. Populariteit is geen first-mover bewijs. Hoge marktverzadiging verlaagt de score.
5. Voorspelling en feit blijven strikt gescheiden in content. Geen verzonnen feiten, cases, cijfers of ervaringen.
6. Iedere gekozen forecast krijgt outcome- en calibration-verplichtingen.
7. Geen `completed`, `live`, `published` of `learned` zonder execution/readback evidence.
8. Alle kanalen blijven onder hun bestaande identity hard gates.
9. Dagelijkse beslissingen optimaliseren niet alleen voor bereik maar voor gekwalificeerde aandacht, lead, afspraak, offerte, order, omzet en voorspellend leervermogen.
10. Systeem leert zowel welke content werkt als welke signalen voorspellend zijn en hoeveel dagen lead time optimaal is.

## Bestaande componenten die blijven
- `bg-externe-signalen` — externe signalen en bronvertrouwen.
- `bg-zoekwoordkansen` — zoekvraag- en SEO-kansen.
- `bg-kansenradar` — reactieve/actuele kansen.
- `powerhouse-runtime` — canonieke dagelijkse Powerhouse-run.
- `powerhouse-content-orchestrator` v3 — dagelijkse kanaalbesluiten en artifact generatie.
- `bg-pre-publish-review` — waarheid-, kanaal- en publicatiegates.
- `powerhouse-social-publisher` — LinkedIn delivery.
- `powerhouse-blog-queue` / approved central blog path — blog delivery.
- `bg-buffer-sync`, `social-learning-store`, `revenue-learning-store` — readback, social learning en revenue learning.
- `bg-experimentcyclus` — experiment- en optimalisatielus.
- `bg-master-control` — operationele status/readback.

## Nieuwe kernlaag
### 1. Predictive signals
Tabel `powerhouse_predictive_signals` normaliseert weak signals uit externe bronnen, search, social, website, sales, company intelligence en learnings. Elk signaal bevat bron/evidence, freshness, novelty, velocity/acceleration, strategic fit en segment/context.

### 2. Forecasts
Tabel `powerhouse_forecasts` bevat vooraf vastgelegde voorspellingen:
- subject/topic/segment
- forecast statement
- expected problem/search intent/buying trigger
- horizon: 7/30/90 dagen of concrete `expected_by`
- probability 0..1
- confidence 0..1
- expected lead days
- market saturation 0..1
- strategic fit 0..1
- commercial potential 0..1
- first-mover score 0..100
- evidence refs
- lifecycle: candidate/active/materialized/missed/expired/rejected

### 3. First-mover claims
Tabel `powerhouse_first_mover_claims` koppelt een forecast aan een claim/frame/term en de content die Bedrijfsgeheugen gebruikt om positie te nemen. Modes:
- `reactive`
- `anticipatory`
- `category_creation`

### 4. Forecast calibration
Tabel `powerhouse_forecast_calibration` legt vast:
- of de voorspelling materialiseerde
- observed_at / materialized_at
- werkelijke lead days
- Brier component `(probability-outcome)^2`
- content lift
- lead/meeting/proposal/order/revenue impact
- evidence refs

### 5. First-mover queue
View `powerhouse_first_mover_queue` rangschikt actieve forecasts. Score is gebaseerd op probability × confidence × signal acceleration × strategic fit × commercial potential × whitespace × lead-time advantage, met negatieve impact van market saturation. De view is de canonieke predictive input voor de dagelijkse contentbeslissing.

## Dagelijkse datastroom
1. Signal ingestion: externe signalen, GSC/DataForSEO, website/social performance, connecties/bedrijven, sales/revenue, learnings.
2. Predictive engine clustert signalen en schrijft/actualiseert forecasts.
3. Forecast engine bepaalt probability/confidence/horizon/lead-time.
4. First-mover engine bepaalt whitespace, saturation, commercial potential en first-mover score.
5. Alleen voldoende onderbouwde forecasts komen in `powerhouse_first_mover_queue`.
6. `powerhouse-content-orchestrator` leest deze queue naast bestaande recommendations, performance en schrijfregels.
7. Per kanaal wordt publish/skip/hold besloten; predictive content bevat forecast-id, mode en prediction rationale in generation evidence.
8. `bg-pre-publish-review` blijft fail-closed voor waarheid, identity en meetbaarheid.
9. Delivery loopt via bestaande publisher/blogpaden.
10. Buffer/GA4/GSC/sales/revenue readback schrijft outcomes terug.
11. Calibration beoordeelt forecasts na horizon of zodra materialisatie-evidence bestaat.
12. Calibration en commerciële effecten worden opnieuw input voor volgende predictive scoring en contentbeslissingen.

## First-mover beslisregels
- Een onderwerp dat al breed trending is krijgt geen hoge first-mover score puur door volume.
- `anticipatory` vereist minimaal meerdere onafhankelijke signalen of één zeer sterke primaire bron plus corroboratie.
- `category_creation` vereist aantoonbare semantic whitespace en mag geen toekomstfeit als bestaand feit formuleren.
- Lage confidence kan wel leiden tot observe/hold, niet automatisch tot publicatie.
- Hoge first-mover score zonder strategische/commerciële fit publiceert niet automatisch.
- Revenue potential beïnvloedt prioriteit maar mag evidence-quality nooit overstemmen.

## Revenue target en besturingslogica
Hoofddoel: €1.000.000 gerealiseerde omzet uiterlijk 2027-09-14.

Het systeem optimaliseert op de keten:
`attention -> qualified attention -> lead -> meeting -> proposal -> order -> realized revenue`.

Dagelijkse en wekelijkse beslissingen moeten daarom naast contentmetrics minimaal rekening houden met:
- pipeline coverage
- lead velocity
- meeting conversion
- proposal conversion
- win rate
- average order value
- realized revenue
- forecasted revenue
- attribution confidence
- tijd tot targetdatum

Geen vanity metric mag zelfstandig de hoogste prioriteit bepalen.

## Dagelijkse hard gates
Een predictive run is pas gezond als:
- signal ingestion is uitgevoerd of expliciet `no-new-signal` bewijst;
- actieve forecasts zijn herberekend of aantoonbaar ongewijzigd;
- first-mover queue is gegenereerd;
- gekozen predictive content een forecast-id/evidence lineage heeft;
- delivery/readback-status bekend is;
- due calibrations zijn uitgevoerd of als open obligation vastgelegd;
- revenue-learning input is bijgewerkt wanneer commerciële outcome-data beschikbaar is.

Bij ontbrekend bewijs wordt de run `degraded`, nooit stilzwijgend `completed`.

## Succescriteria v1
1. Er bestaat één canonieke predictive dataset in Supabase, zonder parallel shadow system.
2. Iedere actieve forecast heeft probability, confidence, horizon en evidence refs vóór publicatie.
3. `powerhouse-content-orchestrator` kan predictive candidates lezen en hun provenance in content artifacts bewaren.
4. First-mover content is traceerbaar naar forecast en claim.
5. Due forecasts kunnen worden gekalibreerd met observed/materialized evidence en Brier component.
6. Dagelijkse health/readback toont predictive freshness, open calibrations en revenue-target progress.
7. Fail-closed gedrag voorkomt dat een run groen wordt als predictive execution/calibration verplichtingen ontbreken.
