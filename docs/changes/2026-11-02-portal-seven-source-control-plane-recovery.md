# 2 november 2026 — volledige zevendelige broncontrole Powerhouse Portaal

## Incident en reproduceerbare afwijking
De oorspronkelijke volledige Unified BRAIN-verificatie `41413309140` bevat **5.365 tests, 5.332 geslaagd, 31 gefaald**. In `tests/brain-powerhouse-existing-systems-portal-readback-20261029.test.mjs` faalden twee claims: (1) een fixtureset met vijf `LIVE`-bronnen werd ten onrechte `READABLE` verwacht, terwijl de bestaande read-model definitie inmiddels zeven verplichte bronnen telt; (2) de mock verwachtte vijf HTTP-reads terwijl de oorspronkelijke bronmodule zeven doet. Dit is specifiek een **historische test-/fixture-afwijking**, geen onafhankelijke observatie dat de producerende Supabase-views zelf werken.

## Bronwaarheid en beveiliging
De bestaande `platform/portal/powerhouse-existing-integration-read-model.mjs` leest uitsluitend zeven geautoriseerde, begrensde read-only bronnen: health, capabilities, intelligence layers, experiments, revenue, loop integrity, terminal control. `sourceState=READABLE` is alleen geldig als **alle zeven** eigen provider-reads geslaagd zijn; zonder loop of terminalbron moet `PARTIAL` plus juiste `SOURCE_UNAVAILABLE` zichtbaar blijven. De oorspronkelijke Netlify adminroute blijft rolbeveiligd, zonder service-key in de browser of nieuwe schrijver.

## Gerichte broncorrectie
De bestaande regressiefixtures en -asserties controleren nu zeven eigen bronnen, alle zeven `GET`-paden, oorspronkelijke autorisatie, en de werkelijke loop/terminalprobleemstatus. Extra negatieve tests dwingen `PARTIAL` af wanneer zesde of zevende bron faalt. De bestaande Portaal Control Plane toont naast `Broncontrole` het getal `Bronnen LIVE: x / 7` (of `ONBEKEND` zonder bronstaten), en **altijd** `Volledige uitvoeringsketen: NIET BEWEZEN` zonder onafhankelijk uitvoering- en uitkomstbewijs.

## Verplichtingen en bewijs
Het oorspronkelijke ONE BRAIN incident `powerhouse|brain|portal-seven-source-fixture-stale|20261102-v1`, bestaande post-merge agent-skill, centrale AGENTS, deze menselijke bronanalyse en development ledger vormen één herstelketen. Regressie en security shadow/canary, beschermd Required/CodeQL, exact gegenereerde System Map/asset-hash, volledige BRAIN-backend, terminalcontrole, Netlify exact-productiedeploy én **ingelogde** private portaal-readback blijven vereist. Alleen daarna mag deze gerichte herstelrelease groen; andere backendfouten, onbewezen sociale publicaties, GA4, leads, betaalde orders en klantwaarde blijven afzonderlijke open verplichtingen. Geen extra scheduler, tweede publisher, ruwe gevoelige data of fictieve KPI.

Oorspronkelijke workflow: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41413309140 . Centrale incidentverplichting: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439 .
