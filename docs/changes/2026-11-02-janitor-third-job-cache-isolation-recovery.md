# 2 november 2026 — derde Janitor-job behoudt cachebeveiliging en krijgt oorspronkelijke regressiedekking

## Waarneming
In originele volledige BRAIN-run [41418160550](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41418160550), backend-job 125187272147, slaagden 5.348 van 5.377 tests; 27 assertions faalden. Eén fout in `tests/brain-janitor-cache-token-isolation-20261023.test.mjs` is de hard-coded verwachting van exact twee originele Janitor-jobs. De werkelijk geautoriseerde workflow `.github/workflows/powerhouse-repository-janitor.yml` bevat er drie: `janitor`, `branch_reconciler` en `branch_archive_sweep`. De derde ruimt branches onafhankelijk op, volgt na `janitor`, heeft een eigen 20-minutenbudget, een 900-seconden sweep-limiet en cap 150. GitHub Actions-cache wordt nergens in deze job gebruikt.

## Principes
De eerste twee oorspronkelijke beveiligde jobs houden ieder `cache-mode: none`, geen `actions/cache` en ongewijzigde bestaande least-privilege beveiligingen. Een nieuw oorspronkelijk werkend onderdeel mag niet verwijderd of gedeactiveerd worden om aan een verouderde statische testtelling te voldoen. In plaats daarvan controleren de tests de complete jobinventaris en extra grenzen voor de derde job, onder behoud van alle originele cancellation/open-PR/head- en securitychecks.

## Verandering
Wijzig uitsluitend de bestaande BRAIN-testfixture `tests/brain-janitor-cache-token-isolation-20261023.test.mjs`; beschermde workflow, GitHub-token, cron, extra job, feitelijke archivering, provider, portal, CMS en klantdata worden niet gewijzigd. Centrale AGENTS, oorspronkelijke Continuity Agent Skill, ONE BRAIN learning met historisch/shadow/canary-acceptatie, menselijk herstelbericht en append-only ledger leggen oorzaak en preventie vast.

## Bewijsplicht
Nieuwe gerichte test, beschermde Required, CodeQL, oorspronkelijke volledige exact-head BRAIN en terminal, onafhankelijke GitHub readback op echte latere Janitor-run en geen herhaling. Open P0 #4439 blijft rood zolang overige tests falen; geen betaalde order of productieklant claim.


### Additional bounded branch-synchronization assertion
The independently failed `tests/brain-autonomous-branch-sync-4914.test.mjs` used `workflow.split('  branch_reconciler:\n')[1]` as an unbounded suffix, then `doesNotMatch(reconciler,/^    needs:/m)`. The appended legitimate `branch_archive_sweep` contains `needs: janitor`, thus false-positive. Now bound the `reconciler` block to the next `branch_archive_sweep` heading, verify no `needs` within its own block, and separately require the archive `needs:janitor` and `timeout-minutes:20`. This is test-only; no source workflow change.
