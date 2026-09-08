# Single-Flight Release Kernel — Design

## Context

Bedrijfsgeheugen heeft inmiddels een sterke release- en Brain-governance-laag, maar pull requests veroorzaken te veel zelfstandige GitHub Actions-runs. De huidige verplichte `Required test` workflow classificeert change scope en delegeert geselecteerde lanes aan reusable workflows; daarnaast reageren meerdere diagnostische, SEO-, shell-, Brain-, preview- en promotion-workflows zelfstandig op `pull_request`. Daardoor kan één wijziging tientallen runner-consuming jobs genereren, terwijl stale heads van dezelfde PR nog doorlopen nadat een nieuwere head al bestaat.

Dit veroorzaakt queue starvation: de branch-protected context `test` kan queued blijven zonder één uitgevoerde stap, terwijl oudere, inhoudelijk achterhaalde PR-runs nog capaciteit gebruiken. Meer runnercapaciteit kopen zou het symptoom vergroten, niet de architectuur corrigeren.

## Doel

Bouw één release-kernel die per PR exact één branch-protected testflight bezit, stale werk automatisch supersedet en alleen de relevante testcontracten uitvoert. Onafhankelijke PR's mogen parallel blijven werken; één PR mag zichzelf nooit meer met tientallen losse workflows blokkeren.

## Kernprincipe

**Independent development, single-flight validation, exact-SHA promotion.**

Per pull request bestaat maximaal één actuele releaseflight. Alleen de nieuwste head-SHA van die PR mag releasecapaciteit gebruiken of de branch-protected `test`-context bepalen. Alle release-blocking checks draaien binnen één GitHub Actions-job op één runner. Niet-release-blocking observability, diagnostics, Brain projection en deep scans verhuizen naar post-merge, schedule, workflow-dispatch of expliciete event-driven uitvoering.

## Architectuur

### 1. Eén branch-protected workflow

`.github/workflows/required-test.yml` wordt de enige workflow die standaard op `pull_request` naar `main` release-blocking runnercapaciteit consumeert.

De workflow krijgt repository-wide stale-head cancellation voor zichzelf:

```yaml
concurrency:
  group: required-test-pr-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

Hierdoor wordt een oudere `Required test` run van dezelfde PR automatisch geannuleerd zodra een nieuwere commit wordt gepusht. Onafhankelijke PR's krijgen verschillende concurrency groups en blijven parallel.

### 2. Eén job, één runner

De huidige multi-job/reusable-workflow-topologie wordt vervangen door één job met de vaste naam `test`.

Binnen deze job:

1. checkout exact head + voldoende history;
2. setup Node/Python/browser dependencies eenmaal;
3. run chat-learning/moving-main preflight;
4. classify changed paths met bestaande `createDeliveryPlan()` en `deriveRequiredTestSuites()`;
5. voer alleen geselecteerde lane-commands uit;
6. verifieer release evidence voor exact head-SHA;
7. eindig alleen success wanneer alle geselecteerde contracts groen zijn.

De branch protection blijft dus context `test` gebruiken, maar er is geen extra aggregator-job of legacy status bridge meer nodig.

### 3. Lane logic wordt runner-local

Reusable workflows als `lane-backend.yml`, `lane-portal.yml`, `lane-website.yml` en `lane-automation.yml` blijven tijdelijk als documentatie/dispatch surface bestaan, maar hun release-blocking commandsets worden gecentraliseerd in runner-local scripts/config zodat de kernel geen extra runners hoeft te alloceren.

Nieuwe interface:

```text
node tools/ci/single-flight-release-kernel.mjs plan --base <sha> --head <sha> --pr <number>
node tools/ci/single-flight-release-kernel.mjs run --base <sha> --head <sha> --pr <number>
```

`plan` retourneert machineleesbaar:

```json
{
  "version": "single-flight-v1",
  "baseSha": "...",
  "headSha": "...",
  "prNumber": 123,
  "changedPaths": [],
  "lanes": ["website"],
  "commands": [
    {"id":"control-plane","command":"node","args":["--test","tests/brain-change-scoped-release-lanes.test.mjs","tests/brain-moving-main-successor-guard.test.mjs","tests/brain-composable-release-control-plane.test.mjs"]}
  ]
}
```

`run` voert exact dat plan sequentieel uit en faalt op de eerste release-blocking fout met lane/command/evidence in stdout.

### 4. Workflow trigger budget

Een repository-contract bewaakt dat release-blocking PR fanout niet opnieuw groeit.

`config/single-flight-release-kernel.json` bevat:

```json
{
  "version": "single-flight-v1",
  "protectedContext": "test",
  "maxPullRequestRunnerWorkflows": 1,
  "requiredWorkflow": ".github/workflows/required-test.yml",
  "staleHeadPolicy": "cancel-in-progress",
  "promotionIdentity": "exact-tested-head"
}
```

Een nieuwe test inventariseert `.github/workflows/*.yml` en faalt wanneer meer dan één workflow een runner-consuming `pull_request` trigger voor `main` heeft. Alleen expliciet runnerloze metadata/webhook constructs mogen via allowlist bestaan.

### 5. Bestaande losse PR-workflows

Workflows die nu zelfstandig op `pull_request` draaien worden in groepen gemigreerd:

- **release-blocking contract** → command in de kernel;
- **diagnostic artifact** → `workflow_dispatch` en eventueel `workflow_run` na failure;
- **preview/readback** → Netlify/externe preview of kernel-local readback wanneer inhoudelijk release-blocking;
- **Brain/learning projection** → post-merge/event-driven; mag de branch-protected test niet dupliceren;
- **production promotion** → `push` op `main`, workflow-dispatch of bestaande BG169 authority; nooit nog als parallelle PR-run;
- **scheduled observation** → schedule blijft ongewijzigd.

Voorbeelden uit de huidige fanout die niet zelfstandig PR-runnercapaciteit mogen blijven gebruiken: `paginacontrole-debug.yml`, `canonical-brand-shell-full-build.yml`, `required-test-status-bridge.yml`, standalone PR Brain/diagnostic/promotion workflows en vergelijkbare duplicaten.

### 6. Preview en productie

Preview blijft een expliciete release-evidence stap, maar niet als extra GitHub-runnerfarm. De kernel gebruikt bestaand Netlify preview evidence waar beschikbaar en draait alleen inhoudelijke readback die nodig is voor de geselecteerde lane.

Na groen:

- exact geteste PR head wordt gemerged via bestaande branch protection;
- BG169/production authority promoveert alleen de geaccepteerde main-SHA;
- productie is pas `PRODUCTION_GREEN/LIVE_VERIFIED` wanneer exact deployed SHA en affected routes/contracts zijn teruggelezen.

Single-flight verandert dus capaciteit en orchestration, niet de kwaliteitslat.

## Migratiestrategie zonder self-lockout

### Fase A — Kernel in shadow

Voeg kernel script, config en tests toe zonder branch protection te wijzigen. `required-test.yml` gebruikt de kernel intern, maar bestaande losse workflows bestaan nog.

### Fase B — Trigger contraction

Zodra de kernel op de feature-PR groen is, wijzig de zelfstandig runner-consuming `pull_request` workflows zodat ze niet meer automatisch bij iedere PR starten. Diagnostiek blijft handmatig/event-driven beschikbaar.

### Fase C — Legacy bridge verwijderen

`required-test-status-bridge.yml` wordt overbodig omdat de enige job direct `name: test` heet en de branch-protected check door GitHub zelf wordt geproduceerd.

### Fase D — Production proof

Merge de kernel, observeer één echte opvolg-PR en bewijs:

- één actuele `Required test` flight per PR;
- nieuwe commit cancelt vorige flight;
- onafhankelijke PR's blijven parallel;
- `test` blijft branch-protected;
- exact-SHA promotion/readback blijft intact;
- geen quality/security/Brain contract wordt stil verwijderd.

## Failure semantics

- `queued`, `pending`, `in_progress`, open PR, deploy pending en ontbrekende readback zijn non-terminal.
- Een failed command produceert lane + command id + exit status en blijft herstelinput.
- Stale SHA mag nooit success/failure publiceren voor de actuele PR-head.
- Maximaal twee identieke retries per hypothese; daarna nieuwe root-causehypothese.
- Geen branch-protection bypass.

## Meetbare acceptatiecriteria

1. `Required test` heeft exact één runner job met naam `test`.
2. `concurrency.cancel-in-progress` staat aan per PR.
3. Repository-contract telt maximaal één automatisch runner-consuming PR-workflow voor releasevalidatie.
4. De kernel hergebruikt bestaande lane-classificatie en voert alleen geselecteerde suites uit.
5. Een synthetic stale-head test bewijst dat alleen `headSha` in plan/evidence mag voorkomen.
6. Bestaande core release tests blijven groen.
7. PR #1161 of een opvolger kan via de nieuwe architectuur door `test` naar merge zonder runnerfanout worden gebracht.
8. Na merge is de kernel op `main` aanwezig en wordt release-/production-readback op exact merge-SHA uitgevoerd.
9. Durable learning fingerprint: `delivery|capacity|single-flight-pr-release-v1`.

## Niet-doelen

- Geen extra betaalde runnercapaciteit aanschaffen.
- Geen security- of branch-protectioncontrole verzwakken.
- Geen kwaliteitschecks verwijderen om snelheid te winnen.
- Geen eigen tweede CI-platform introduceren wanneer dezelfde checks runner-local kunnen worden uitgevoerd.
- Geen globale serialisatie van verschillende PR's: alleen stale werk binnen dezelfde PR wordt gecanceld.
