# Incident en bronfix — originele BRAIN-afsluiting mist exact-head dispatch

**Datum:** 2 november 2026. **Oorspronkelijk incident:** `powerhouse|terminal|exact-head-unified-brain-run-missing|20261029-v1`. **Bestaande eigenaar:** GitHub Powerhouse Obligation Terminal Closure / Unified Brain Delivery op beschermde `main`.

## Waarneming en root cause

De gewone Required- en CodeQL-gates van PR #5246 waren groen; de branch is beschermd gemerged op `5b1fc01c8d577c73b62aea2f70030e3a5d7cb838`. De oorspronkelijke terminalworkflow #41350194932 faalde desondanks met `TERMINAL_CRITICAL_GATE_NOT_TERMINAL:BRAIN` na zoeken naar een workflow_dispatch-run met exacte titel `BRAIN delivery PR #5246 293bc635e5521472c56974dc74910bffe25c4f60`. **Oorzaak:** de terminalizer eiste een reeds bestaande BRAIN-dispatch zonder deze zelf gegarandeerd aan te vragen; dit was een eerdere herhaalde fout uit 29 oktober.

## Canonieke wijziging, geen bypass

Dezelfde beschermde `.github/workflows/obligation-terminal-closure.yml` krijgt een preflightstap **na** verificatie van de gemergede PR en **vóór** de bestaande BRAIN-required-gate. De stap controleert originele repo, merged status, base main, exacte HEAD- en mergecommit, de vertrouwde main-afstamming en of de exacte BRAIN-run al bestaat. Alleen als die ontbreekt doet de oorspronkelijke terminalizer één `workflow_dispatch` naar de **bestaande** `unified-brain-delivery.yml` op `ref=main` met `verification_only=true`. Een reeds mislukte of actieve run wordt niet dubbel uitgegeven; de bronoorzaak wordt niet omzeild. De definitieve terminalpoort blijft afhankelijk van een werkelijk afgeronde, succesvolle, vertrouwde exact-head BRAIN-workflow. Het terugkijken van een latere commit is geen substituut.

De tijdelijke `actions: write` autorisatie is uitsluitend bedoeld voor het dispatchen van de bestaande verificatieworkflow vanuit de originele terminal-context. Productiehandomzet, ongedocumenteerde merges, SEO, site/CMS, verzending of Instagram worden niet gestart. De BRAIN-workflow behoudt haar bestaande vrijgavevoorwaarden, en `verification_only` verbiedt BG169-productiepromotie.

## Verificatie en definitie van klaar

Beschermde test `tests/brain-terminal-canonical-verify-only-dispatch-20261102.test.mjs` en bestaande bron-/delivery-/securitytests moeten allemaal slagen. Pas na protected merge en een **natuurlijke** gemergde PR-run met exact `BRAIN`-success, original terminal success, provider-readback en later herhalingscontrole mag het incident `PROVEN` worden. Voor historisch PR #5246 is nog apart een originele read-only replay/afsluitrun nodig; een nieuwe merge wist diens mislukte historische run niet.

De andere LinkedIn-editorial PR #5243 is al apart technisch live. Bereik, views, leads en orders blijven UNKNOWN totdat onafhankelijke providerdata dat onderbouwen.

Zie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439 en https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41350194932.

## Portaalbewijs

De bestaande beveiligde admin-API `/api/powerhouse-cro-other-data` leest hetzelfde originele ONE BRAIN-incident met een afzonderlijke doelgerichte `brain_failure_registry`-query; hierdoor valt het niet uit de generieke laatste-twintig-lijst. De bestaande `Andere data`-module toont bronstatus, maturiteit, herhaling, root cause, mislukte workflow en expliciet onbekende commerciële uitkomst. Geen nieuw logregister, geen browserwrite en geen vrijgave van private ruwe incidentdata aan anonieme bezoekers. Ook een geregistreerd `PROVEN`-label blijft zonder onafhankelijk terminal-runbewijs geen autonoom groen.
