# 2026-11-15 — overgebleven GitHub-terminale regressietest na echte BRAIN-bronreparatie

**Bestaand P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
**Bewezen bronfix:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5825 — beschermd gemerged op `06bc3201131191eea4c01588d3701927db04951b`.
**Opvolging:** bestaande PR #5828, scherp beperkt tot het aanvullende niet-gemergde testcontract, bestaande agentrollen en oorspronkelijk ONE BRAIN leren. Geen tweede terminale executor.

## Vastgestelde resterende fout
De eerdere echte `Unified Brain Delivery` `43695381458` faalde op vier oudere regressies; deze vier zijn al door PR #5825 gecorrigeerd. De broncorrectie PR #5821 bleef ongewijzigd. De andere historische `tests/github-delivery-state-machine-terminal-closure.test.mjs` bevatte op het inmiddels bijgewerkte `main` nog twee tests die de verwijderde enkelvoudige `runs?branch=main&event=workflow_dispatch&per_page=100`-query en directe `.display_title==$title` verwachten. Die bronafwijking is zichtbaar in GitHub source, maar was **niet** een vijfde gemeten fout uit die eerdere BRAIN-run; geen valse foutclassificatie.

## Unieke correctie na één oorspronkelijke merge
Alleen deze nog niet bijgewerkte bron-oracletests toetsen nu `originalBrainFlightSince`, volledige native `gh api --paginate --slurp`, `brain-verification-flight-index.mjs`, `created=${created_filter}`, protected-main afkomst, originele BRAIN success en afwijzing van de eerst-100 fallback. De al gemergde vier tests, terminalworkflow, andere skills en bronreparatie van #5825 worden ongewijzigd overgenomen. De bestaande `agent-integration-engineer`, `agent-reliability` en `agent-data-quality` krijgen verantwoordelijkheden voor de volledige end-to-end testinventaris en bewijsbewaking; taken zijn **geen** nieuw agentproces of uitgevoerde ACK.

## Bewijs en acceptatie
Laat exacte kandidaat Required/CodeQL/full BRAIN testen, beschermde merge en oorspronkelijke terminale readback nieuwe lijn aantonen voordat deze gerichte testcorrectie `PROVEN` heet. De oorspronkelijke 14 `INNOVATION_INTAKE` blijven `PLANNED`, 14 `INNOVATION_DELIVERY` blijven `OPEN`, nul echte onafhankelijke uitvoerings-ACK; voortgangsregistratie, geen artificiële afhandeling. Geen tweede scheduler, queue, worker, database, bronlog, provider-credentials of onbeschermde uitrol.

**Herstelbewijs:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5825
**Oorspronkelijke incidentrun:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43695381458

## Correctie na beschermde learning-gate controle

Exact-head Required van deze unieke kandidaat wees terecht een ongeldige evaluatieroute af: `LEARNING_EVALUATION_TEST_PATH_INVALID:historical_replay:tests/github-delivery-state-machine-terminal-closure.test.mjs`. De originele canonicalisatie vereist `tests/brain-*.test.mjs`; de historische testnaam is niet heimelijk hernoemd en de toelatingscontrole is niet uitgezet. Nieuw uitsluitend testgericht `tests/brain-original-terminal-extended-state-machine-v1.test.mjs` importeert de volledige bestaande `github-delivery-state-machine-terminal-closure.test.mjs` zodat werkelijk dezelfde historische tests worden uitgevoerd en voegt de 206-run/derde-providerpagina plus incomplete-pages negatieve regressie toe. De machine-leerregistratie voert dit geaccepteerde wrapperbestand uit in historische replay, shadow en canary. Deze vijf unieke bestanden vormen de volledige definitieve scope; eerdere vier gecorrigeerde tests en skill van #5825 zijn niet opnieuw gewijzigd.
