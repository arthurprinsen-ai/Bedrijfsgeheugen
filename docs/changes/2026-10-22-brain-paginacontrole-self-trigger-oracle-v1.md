# Paginacontrole CI self-trigger oracle — 22 oktober 2026

**Fingerprint:** `ci|brain|paginacontrole-self-trigger-retired-pr-oracle|20261022-v1`  
**Obligation:** `ci-brain-paginacontrole-self-trigger-oracle-20261022-v1`  
**Parent:** [#3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742)

## Geregistreerd probleem
De onafhankelijke [Unified BRAIN-run 39791707071](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071), exact candidate head `8e665a86d2bb54712a34fd88bec0e1213df21dd2`, toont 3.526 tests, 3.171 geslaagd en 355 mislukt. TAP `not ok 1668` komt van `tests/brain-paginacontrole-self-validation.test.mjs`: de test verwacht exact twee letterlijke self-paths. Dat was de oude triggerconfiguratie met afzonderlijke push- en PR-runs.

Huidig `.github/workflows/paginacontrole.yml` bevat terecht één self-path bij `push` naar `main`, plus `workflow_dispatch`, wekelijks schedule en een gedeelde `repo-schrijven`-lock met `cancel-in-progress: false`. De standalone `pull_request`-trigger is bewust vervallen om dubbele dure PR-workflows te voorkomen. De bestaande regressies `tests/paginacontrole-concurrency.test.mjs` en `tests/brain-ci-control-plane-convergence-v1.test.mjs` bewaken dit expliciet. Daarom mag de workflow niet worden teruggedraaid om een verouderde test te laten slagen.

## Broncorrectie en preventie
Alleen de bestaande test is aangepast. Deze bewaakt de werkelijke push-eventbron, één self-path, het ontbreken van dubbele PR-fanout, handmatige en geplande verificatie en de niet-annuleerbare writerlock. Drie negatieve bronmutaties moeten terecht falen: self-path verwijderd, PR-trigger opnieuw toegevoegd, writerlock annuleerbaar gemaakt.

Agent-preflight: vergelijk eerst actueel workflowbestand, canonieke trigger-owner, bestaande governance-tests en incidentfingerprint. Herstel **de tegenstrijdige oracle**, niet een veiliger productie- of CI-contract. Hergebruik dezelfde eigenaar en registreer herhalingen in `public.brain_failure_registry`; geen tweede scheduler, foutregister of delivery-agent.

## Acceptatie
De kandidaat verandert geen runtime, scheduler, provider, SQL, autorisatie of productiesite. Gerichte node-test en historische/shadow/canary-verificatie, daarna exacte-head Required CI en CodeQL. Full Unified BRAIN op één geïntegreerde codeversie moet **0 failures** rapporteren; Supabase clean-room-pariteit #3742 en echte klantacceptatie #4215 blijven afzonderlijke verplichtingen. Totdat alles bewezen is blijft deze PR DRAFT/CANDIDATE; geen numerieke vermindering op basis van losse tests.
