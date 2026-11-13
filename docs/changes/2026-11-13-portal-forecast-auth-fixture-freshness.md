# 13 november 2026 — tijdvaste portaalprognose-regressies, bestaande financiële beveiliging blijft intact

## Waarom

Tijdens de oorspronkelijke, beschermde releasecontrole van social provider-poll PR #5730 werden twee reeds bestaande positieve, geauthenticeerde `portal-forecast-auth.test.mjs`-tests afgekeurd. De fixtures hadden een onafhankelijke financiële bronobservatie `2026-10-14T10:00:00Z` en latere bevestiging `2026-10-14T12:00:00Z`. Op 13 november 2026 na 10:00 UTC lagen deze beide buiten de oorspronkelijke 30-dagenlimiet. De productie-API van `platform/api/portal-forecast-handler.mjs` verwijderde de verlopen forecast **terecht** (`0 !== 1`). Het was een met de kalender aflopende **testaanname**, niet een reden om finance- of tenantbeveiliging te verlagen.

## Exacte herstelactie van de originele portaaltest-eigenaar

De twee positieve API-tests genereren voortaan hun eigen **genuanceerde echte verse** fixture: bron `updatedAt` één uur voor het testtijdstip, onafhankelijk geverifieerde `verifiedAt` 30 minuten vóór het testtijdstip, beide binnen de originele harde limiet en `updatedAt <= verifiedAt`. De overige tests behouden hun expliciet gefixeerde `now` en negatieve gevallen; een extra API-regressie eist dat een bron van 35 dagen en attestatie van 34 dagen oud als `NO_VALIDATED_FINANCIAL_FORECASTS` wordt afgewezen. De geauthenticeerde tenant-ID en originele bron-, model-, historie-, forecast- en validatievelden blijven onveranderd.

De nieuwe verplichte machinegestructureerde regressie `tests/brain-portal-forecast-freshness-fixture-20261113.test.mjs` bewijst drie contracten: recente bron plus latere onafhankelijke attestatie wordt door de originele API toegelaten, werkelijk oude bewijsstukken worden afgewezen en de live beleidsfunctie bevat nog steeds de harde 30-dagen- en tenantvoorwaarden.

## Borging

- Geen productiewijziging, nieuwe endpoint, token, tenant-uitzondering, versoepelde finance-freshness of nieuw consumerpad.
- Oorspronkelijke Agent-/Skill-norm in `.agents/skills/portal-living-interface/SKILL.md`.
- Machinelearning `brain/learning/2026-11-13-portal-forecast-expired-ci-fixture-v1.json`; menselijk incidentbewijs `docs/development-ledger-events/2026-11-13-portal-forecast-expired-ci-fixture.md`.
- Canonieke bronregistratie: [P0 #4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215) en gerelateerde [P0 #4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198), geen tweede scheduler.
- Werk telt pas na exact-head Required, CodeQL, beschermde merge en onafhankelijke `main` bronreadback; de oorspronkelijke social-metrics-release #5730 krijgt **daarna** nieuwe Required op zijn bijgewerkte head en aparte echte productie-bewijzen.
