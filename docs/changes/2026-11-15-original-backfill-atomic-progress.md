# ONE BRAIN — oorspronkelijke backfill behoudt voortgangscheckpoint na gedeeltelijke uitvoering
Datum: 15 november 2026. Bestaand P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Geobserveerde oorzaak
De bestaande `Completion Supervisor Backfill Resume` draaide bij run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43697572565 langer dan een half uur in de actieve collect/resume-stap en werd geannuleerd zonder compleet rapport of artifact. Opvolger https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43699612359 werd eveneens geannuleerd. Oudere PR #5835 en #5837 hebben historische bron-fan-out en gemengde `WAIT_EXTERNAL`-bypass al gecorrigeerd en op beschermde main gemerged. Een ander gat bleef: `main()` schreef het originele JSON-rapport pas **na alle** originelen hersteltriggers. Bij storing of mislukte side-effect ontstond daardoor geen onafhankelijk leesbare partiële voortgang.

## Implementatie in dezelfde keten
- Originele `tools/outcome-obligation-completion-supervisor-backfill.mjs` schrijft vóór een herstelactie `IN_PROGRESS` met exacte `sourceCandidates`, `expectedDispatches`, 0 `completedDispatches` en oorspronkelijke invariante bron- en dispatch-identiteit.
- Elke teruggemelde oorspronkelijke `runOutcomeObligationCli`-hervatting schrijft via tijdelijke file + atomaire rename hetzelfde originele rapport met een bijgewerkte oplopende `completedDispatches`; geen tweede executor, database, queue of schema.
- Pas wanneer ieder geordend origineel obligationId met dezelfde `coalesceKey` is hervat, wordt `resumeCheckpoint.state=COMPLETE`. Dubbele triggers, verkeerde identities en ontbrekende receipts falen gesloten.
- De bestaande workflow krijgt `if: always()` op **dezelfde** bestaande artifact-upload, met `if-no-files-found: error` onveranderd. Bij harde runner cancellation kan ook de upload ontbreken; dit wordt niet ten onrechte als succes gelabeld.
- `COMPLETE` is slechts het aanbieden van canonieke idempotente hersteltriggers: geen claim van echt `PROCESSED`, provider-publicatie, verkopen of effectmeting. Oorspronkelijke dispatches/evidence blijven append-only; workflow blijft in hetzelfde concurrency group.

## Bewijs en regressie
Originele `tests/brain-completion-supervisor-backfill.test.mjs` controleert onvolledige checkpoint vóór en na één resume, duplicaatverplichting, gewijzigd `coalesceKey`, onvolledige `COMPLETE`-claim, en workflow artifactgedrag. Exact-head Required + CodeQL, beschermd merge, Netlify exact SHA, daarna eerste originele echte workflow artifact met passende source count/dispatch count zijn afzonderlijke release-acceptatie. Ongeacht die controles blijven onafhankelijke agent-consumer, provider/Heartbeat resultaat en later toegepast leren nog verplicht.

## Overdracht
Originele Reliability/Completion Supervisor beheert dezelfde workflow en hersteltrigger; Data Quality toetst count, identiteit en verdwijning van records; BG169 beheert protected release. Behoud P0 #4198 OPEN zolang echte consumer-resultaten ontbreken. Geen parallel uitvoeringspad, nieuwe toestemmingstruc, providerverzending of bulkclose.
