# Regelgevingsimpact met zichtbare pagina- en kaartcontext — 8 oktober 2026

Doel: bestaande klantdata en officiële wijzigingssignalen niet alleen tonen als generieke compliancekaart maar vertalen naar de **juiste bestaande** klantpagina's, risicobeoordelingen en roadmapvoorstellen.

## Existing-state-first
Main commit bij start: `7553fb733f7a39c27077e683af46f352084390b3` (PR #4221). De native formulierinventaris en tientallen al bestaande P1/P2 kaarten werken op bestaande tenant-scoped `domainState`. Geen nieuwe Brain, achtergrondtaak, database of connector.

## Nieuw, beperkt tot de bestaande frontend
- `regulatory-context-trace.js`: herleidbare reviewmapping per AI Act, AVG/GDPR, NIS2/Cbw, DORA, CSRD/ESRS, arbeidsrecht en financiële wetgeving. Onbekende regelgeving blijft op generieke menselijke triage. Per event: bron, ingangsdatum indien bekend, toepasselijkheidsstatus, geraakte pagina, relatie en ontbrekende bewijsstukken.
- `contextual-action-cards.js`: behoud bestaande tenantbron, P1/P2 beoordeling en voorstelactie; voeg specifieke pagina-/reviewtrace toe. Geen fictieve `€`-effecten.
- `foresight-context-ui.js`: toon bij `Je gegevens invullen` een uitklapbare **declaratieve** inventaris per veld, pagina, model en gevolg. Toon op elke relevante klantpagina welke domeinen/pagina's geraakt worden en waarom. Onderliggende zakelijke kaarten blijven voorstellen die klant expliciet kan toevoegen aan de bestaande roadmap.
- Regressies op wettype, gevalideerd versus onbewezen bron/tenantcontext, financiële niet-claims en routevaliditeit.

## Open bewijsgates uit issue #4215
Declaratie is geen geobserveerd DOM-veld of backend-ACK. Losse legacy/standalone formulieren, nieuwe officiële bronobservatie→Company Graph→tenant event, multisysteem-herberekening, echte providerreadback en twee-geauthenticeerde-tenant E2E blijven open. Gebruikersinvoer en bronclaims worden niet gebruikt als juridische conclusie. Test- en CI-resultaten zijn geen productie- of klantbewijs.

## Acceptatie
1. Bestaande `portal-v2` regressies incl. nieuwe `tests/brain-regulatory-context-trace.test.mjs` groen.
2. Protected merge zonder autorisatieversoepeling; Netlify exacte source SHA bevestigt live release.
3. Volledig issue #4215 blijft open tot bewezen bron→tenant→kaart/finance/risico→roadmap→Brain-ACK en werkelijke legacy/connector dekking.
