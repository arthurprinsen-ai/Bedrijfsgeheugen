# Powerhouse Full-Cycle Proof v1 — Design

## Doel

Bedrijfsgeheugen Powerhouse moet iedere dag aantoonbaar één gesloten commerciële cyclus uitvoeren op basis van de bestaande canonieke componenten: actuele signalen → opportunity/forecast → next-best-action → kanaaluitvoering → productie/provider-readback → outcome → revenue attribution → calibration → volgende beslissing. Het systeem mag geen parallel CRM, analytics store, brain, queue, kalender, schedulerfamilie of learning store introduceren.

## Architectuurprincipes

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- Supabase/Powerhouse blijft de canonieke operationele waarheid; GitHub is de canonieke code- en delivery-governance; Netlify/Buffer/Gmail/LinkedIn-provider readback leveren externe uitvoeringsevidence; Notion blijft menselijk leesbare planning/operatie waar reeds gebruikt.
- Realized revenue is de primaire reward. Impressions, clicks, engagement, leads en pipeline zijn tussenliggende outcomes en mogen revenue niet vervangen.
- Alle automatische beslissingen zijn fail-closed bij ontbrekende freshness, identity, eligibility, contact-pressure, truth of provider-readback evidence.
- Geen Make.

## Bestaande componenten die worden geconsolideerd

De nog geldige delta’s uit open werk rond de seven-channel closed loop, revenue learning, revenue flywheel, LinkedIn sales intelligence en forecast calibration worden tegen current main geconsolideerd. Superseded of volledig opgenomen PR’s worden daarna gesloten; er wordt geen tweede implementatie naast current main gehouden.

## Full-cycle orchestrator

De bestaande dagelijkse Powerhouse-uitvoering krijgt één formele run-lineage per business date. De orchestrator:

1. valideert bron-freshness/completeness en stopt fail-closed bij kritieke gaten;
2. leest de bestaande signalen, relationship graph, content/SEO/analytics en commerciële context;
3. materialiseert forecasts/opportunities in de bestaande Powerhouse-tabellen;
4. kiest next-best-actions op expected realized revenue, met identity/truth/contact-pressure/dedupe gates;
5. stuurt alleen uit via reeds ondersteunde kanaalroutes;
6. vereist provider/public production readback voor status `LIVE_PROVEN`/equivalent;
7. koppelt geobserveerde outcomes en waar aanwezig realized revenue terug aan dezelfde lineage;
8. calibreert forecasts en experimentperformance;
9. schrijft de gewijzigde policy/decision evidence terug voor de volgende cyclus;
10. publiceert één machineleesbare cycle-health eindstatus.

## Data-contract

Bestaande canonical stores blijven leidend, waaronder minimaal `powerhouse_forecasts`, `powerhouse_sales_actions`, `powerhouse_sales_outcomes`, `powerhouse_forecast_calibration`, `powerhouse_runtime_events`, bestaande relationship/intelligence stores, publication obligations en failure/learning registries. Nieuwe tabellen zijn alleen toegestaan als current main aantoonbaar geen passende bestaande canonical store bevat; voorkeur is uitbreiding van bestaande records/views/functions.

Elke run behoudt lineage van signal/evidence → forecast → decision/action → external readback → outcome → calibration. Idempotency/dedupe moet reruns veilig maken.

## Commercial intelligence

Opportunity discovery combineert bestaande interne data met actuele markt-/company-signalen waar de bestaande Powerhouse-routes die ondersteunen. Buying-window scoring, next-best-action en offer selection moeten altijd bewijsbaar zijn en een confidence/expected-value rationale behouden. Relationship intelligence gebruikt bestaande personen/bedrijven/interacties en wordt verrijkt zonder parallel CRM.

## Experimenten en offer learning

Experimenten mogen variëren op hook, probleemfase, psychologisch mechanisme, format, CTA, bewijs, timing, kanaalcombinatie en aanbod. Champion/challenger-promotie is alleen toegestaan na voldoende outcome-evidence; zonder bewijs blijft exploit/explore conservatief. Offer learning omvat Frisse Blik, bedrijfsscan en vervolg-/sectorvarianten waar reeds canoniek beschreven.

## Attribution en revenue

Cross-channel attribution volgt dezelfde lineage. Revenue wordt uitsluitend als realized revenue geregistreerd wanneer die expliciet is geobserveerd; geschatte of pipelinewaarden blijven afzonderlijke forecast/outcome-velden. Optimalisatie gebruikt realized revenue als primaire reward en secundaire KPI’s uitsluitend als leading indicators.

## Health / executive cockpit

De bestaande cockpit/health-laag krijgt één samenvattende full-cycle status per dag met minimaal: freshness, decisions, executed actions, live/provider proofs, warmere commerciële kansen, pipeline/revenue outcomes, experiment winners/holds, calibration health, incidents/learnings en de volgende automatische actie. Status is fail-closed en mag niet groen worden op basis van alleen intentie of queued werk.

## Failure learning

Elke failure, hold, retry, non-response en succesuitkomst krijgt evidence in de bestaande failure/runtime/learning lineage. Bekende fingerprints worden hergebruikt; nieuwe fingerprints ontstaan alleen voor aantoonbaar nieuwe root causes. Een fix is pas `PROVEN` na regressietest + productie/provider-readback.

## Definition of done

De wijziging is pas klaar als:

- current-main delta’s uit de relevante open PR’s aantoonbaar zijn geconsolideerd of expliciet superseded;
- protected Required/test en relevante BRAIN/delivery lanes groen zijn op exact dezelfde candidate SHA;
- merge naar protected main geslaagd is;
- productie exact de gemergde/current-main lineage draait;
- één echte full-cycle run een harde eindstatus en evidence oplevert;
- Powerhouse readback de orchestrator-run, action/outcome/calibration-lineage en learning/writeback toont;
- publieke/provider-uitvoering waar van toepassing onafhankelijk is teruggelezen;
- open superseded PR’s zijn opgeschoond zodat zij geen tweede waarheid vormen.
