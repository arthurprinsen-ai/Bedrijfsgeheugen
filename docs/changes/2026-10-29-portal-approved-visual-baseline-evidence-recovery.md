# Portal V2 visuele productiecontrole — diagnose en veilig herstel

**Datum:** 29 oktober 2026. **Eigenaar:** de bestaande Portal V2 Production DOM Readback owner. **Incident:** `powerhouse|portal|approved-visual-baseline-artifact-missing|20261029` in bestaande ONE BRAIN / `brain_failure_registry`. Geen nieuwe scheduler of visuele verificatiedienst.

## Probleem voor mensen
De pagina **Data & intelligence → Andere data** is werkelijk op productie gepubliceerd via de beschermde PR #5140 (main `6487786733cd332edd777af3881e68aca806bf92`, Netlify READY `6ae381b55f2b8b632681f6be`). De algemene Production Release Readback slaagde. Maar de aparte workflow **Portal V2 Production DOM Readback** #40921310588 faalde bij het ophalen van een visueel referentieplaatje. GitHub meldde `no valid artifacts found to download`.

## Oorzaak
Een succesvol gemarkeerde workflow_run werd ten onrechte gelijkgesteld aan het bestaan van zijn optionele screenshot-artifact. De code vroeg onmiddellijk een screenshot op zonder eerst in de officiële GitHub-artifactlijst te controleren of het exacte bestand van de goedgekeurde PR-head aanwezig en niet verlopen was.

## Herstel en regressie
De bestaande workflow inspecteert nu expliciet de GitHub Actions-artifactlijst voor `visual-baseline-pr-<nummer>-<exacte_sha>` en `expired=false`. Ontbreekt de artifact, dan wordt de **al bestaande, veilig begrensde** fallback gebruikt: screenshot van immutable Netlify-preview van die exacte head óf een geïsoleerde browseropname van de exacte, beschermd gemergde PR-source. Vervolgens blijft de pixelvergelijking met de productiebrowser **verplicht**. Geen willekeurige oude baseline, geen uitgeschakelde snapshotvergelijking, geen kunstmatige groene status.

Regressie: `tests/brain-portal-approved-visual-artifact-fallback-20261029.test.mjs`. Agent-erfenis via de bestaande `AGENTS.md`, bestaande Portal V2/Powerhouse-skills, ONE BRAIN-fingerprint en Heartbeat. Log workflow-id, broncommit, immutable screenshot SHA, verschilscore, oorzaak, oplossing en exacte readback; geen klantdata of screenshots met persoonsgegevens publiceren.

## Afsluitcriteria
De wijziging moet door de beschermde Required/BRAIN/CodeQL en merge, gevolgd door een echte, geslaagde visual DOM-productie-readback op exact gepubliceerde SHA. **Huidige status: CANDIDATE / VISUAL_NOT_VERIFIED**, ondanks eerdere technisch bevestigde live code. Leads, betaalde orders en causale CRO-experimenten blijven apart onbewezen.
