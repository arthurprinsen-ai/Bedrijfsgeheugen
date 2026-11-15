# 2026-11-15 — oorspronkelijke BRAIN backend terminal-contractregressies

**Bestaand P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198  
**Oorspronkelijke eigenaar:** ONE BRAIN / Obligation Terminal Closure / Engineering + Reliability + Data Quality  
**Bronproductie:** beschermd main `ded9ff6a1ace0c39f2520b978bce666342b9c487` (#5821).

## Herhaalbaar incident, onafhankelijk bewijs

- Required `43695108633` = success; CodeQL `43695108559` = success; Netlify-preview = success.
- De originele terminal verzocht de bestaande exacte `Unified Brain Delivery` run `43695381458` en stopte terecht na diens `failure`; terminal `43695356905` = failure.
- De volledige BRAIN backend-lane rapporteert vier mislukte tests (zie Artifact `14154123742`), die nog een oude `per_page=100`-enkelvoudige providerlezing en een directe `.display_title==$title`-selector vereisten. Dit contract was al correct vervangen door de volledige `originalBrainFlightSince` + `brain-verification-flight-index.mjs`-bronvalidatie. De bestaande runtime-fixture mockte eveneens alleen de vervallen query; overige terminalcontroles blijven vereist.
- Oorzaak: de enige source change werd in de targeted Required-suite gedekt, maar vier bredere regressies bleven op de oude, onveilige selector staan. Niet de juiste source terugdraaien om de regressies groen te maken.

## Correctie en preventie, dezelfde keten

De vijf bestaande testbestanden van de originale BRAIN-terminalbron zijn aangepast om de *echte* finale poort te controleren op compleet PR-era paging, exact PR/head, identiteit/owner, protected-main run-source, completed+success en fail-closed onbekend/partieel providerbewijs. De originele runtime-autoriteitstest emuleert de nieuwe native GitHub-historie met drie volledige pagina's, een exacte late run en een bewust onvolledige pagina. De afzonderlijke oude terminalizer blijft ongewijzigd; geen parallelle owner of scheduler.

Bestaande `agent-integration-engineer`, `agent-reliability` en `agent-data-quality` hebben expliciete contractcontrole-taken gekregen; de bestaande post-merge skill en machine learning zijn bijgewerkt. De achterstand van 14 innovation-intakes blijft de echte eigenaar en mag niet administratief naar COMPLETED worden omgezet. Dezelfde PR vereist volledig nieuw exact-head Required/BRAIN/CodeQL + protected merge + onafhankelijke terminal en productie-readback, pas dan LIVE. Deze gebeurtenis telt als OBSERVED totdat echt herstel herhaald is. Geen nieuwe opslag, consumer ACK of bedrijfsresultaat gefingeerd.

**Bewijs:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43695381458 ; https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43695356905 ; https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5821 .
