# CI-readback wachtvenster: test-orakel op externe preview beperken

Datum: 22 oktober 2026 · P0 #3742 · kandidaat, niet live

Fingerprint: `github|ci-automation|portal-readback-localhost-loop-false-oracle|20261022-v1`.

## Probleem
GitHub Required run 39827594879 / automation job 119995933814 faalde in `tests/delivery-readback-wachtvenster.test.mjs`: de test verbood elke `seq 1 30` in het volledige Portal V2 production DOM workflowbestand.
De enige bestaande match wacht maximaal 30 × 1 seconde op een lokale `127.0.0.1:4173` http.server voor een goedgekeurde PR-bron. De beschermde externe providerreadback gebruikt afzonderlijk `tools/ci/wait-for-url.sh`, dat minstens 600 seconden toestaat.

## Correctie
Verbied alleen korte loops die daadwerkelijke externe preview-URL's of variabelen `PORTAL_ALIAS_URL` / `READBACK_URL` pollen. Behoud de bestaande algemene detectie in de test en de gedeelde wachttijd. Voeg drie gerichte regressiegevallen toe: lokaal toegestaan, externe alias verboden en directe deploy-preview-host verboden.

## Vrijgave
Test-only, geen workflow/runtime wijziging, geen scheduler of nieuwe foutregistratie. Red→green lokale test, exact-head Required CI+CodeQL, protected merge, hoofdbranch-readback en BRAIN-bewijs vereist. Andere incidenten #4655/#4661 blijven onafhankelijk.
