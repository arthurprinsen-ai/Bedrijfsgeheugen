# 13 november 2026 — originele portaalprognose-freshness CI-regressie

## Onafhankelijke bronbevinding

De originele `platform/api/portal-forecast-handler.mjs` weigert correct een financieel forecast als bron-`updatedAt` of onafhankelijk review-`verifiedAt` ouder dan 30 dagen is of als bron en review niet op dezelfde geautoriseerde tenant behoren. Twee positieve geauthenticeerde testen in `tests/portal-forecast-auth.test.mjs` gebruikten ten onrechte statische bron-`updatedAt=2026-10-14T10:00:00Z` en review-`verifiedAt=2026-10-14T12:00:00Z`. De beschermde Required-preflight voor sociale provider-audit PR #5730 van 13 november (10:14 UTC) kreeg op regels 27 en 135 terecht `0 !== 1` doordat de attestaties inmiddels voorbij de dertigdagengrens waren. De productielogica was niet defect; de fixtures waren verlopen.

## Herstel binnen oorspronkelijke portaaltest-owner

De twee **positieve** auth-handlerfixtures gebruiken voortaan telkens één daadwerkelijk verse testklok, bronobservatie circa één uur eerder en onafhankelijke attestatie circa dertig minuten eerder. De originele tenantbinding, minimaal zes chronologische historiepunten, forecastbron, model, validering en API-respons blijven ongewijzigd. Alle **historische en negatieve** regressies behouden hun expliciete vaste `now`, zodat verouderde, toekomstige, verkeerde en nog niet onafhankelijk goedgekeurde financiële data altijd worden afgewezen.

Een aanvullende geauthenticeerde API-regressie controleert dat een originele 35 dagen oude bron plus 34 dagen oude onafhankelijke review het expliciete `NO_VALIDATED_FINANCIAL_FORECASTS`-antwoord geven, **niet** een vals positieve grafiek. Machineleesbare validatie via `tests/brain-portal-forecast-freshness-fixture-20261113.test.mjs` in historical-replay, shadow en canary; de bestaande `tests/portal-forecast-auth.test.mjs` blijft de echte functionaliteit testen. Regels geborgd in `.agents/skills/portal-living-interface/SKILL.md`, ONE BRAIN-incident `brain/learning/2026-11-13-portal-forecast-expired-ci-fixture-v1.json` en `docs/development-ledger-events/2026-11-13-portal-forecast-expired-ci-fixture.md`.

## Beschermde acceptatie en downstream

De wijziging is een **test- en broncontractherstel**. Geen productiecode, extra provider, rolgrant, versoepeling van tenantautorisatie of verlenging van de dertigdagentermijn. Eerst exacte Required/BRAIN/CodeQL op de nieuwe PR-head en beschermde merge onder oorspronkelijke portaal-eigenaar. Daarna pas het bestaande oorspronkelijke social-poll PR #5730 synchroniseren met actuele main en opnieuw testen, beschermd mergen en Edge provider-readback uitvoeren. De sociale 365 bron-/consumentenverplichtingen en 184 ontbrekende leerbewijzen worden hierdoor niet automatisch voldaan.

Originele P0 [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215); gerelateerde release [#5730](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5730); geen tweede scheduler, geen kunstmatig groen.
