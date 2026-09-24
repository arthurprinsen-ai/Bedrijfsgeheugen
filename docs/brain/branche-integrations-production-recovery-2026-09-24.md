# Branche-integraties production recovery — 2026-09-24

Fingerprint: `branche-integrations-production-recovery-v1`

## Signaal
De branche-applicaties uit PR #2714 waren gemerged naar main, maar productie kon niet betrouwbaar worden bewezen.

## Root cause
1. Nieuwe root-level branchepagina's en de regressietest waren aanvankelijk niet geregistreerd in de website delivery-lane.
2. De regressietest `tests/branche-applicaties-integraties.test.mjs` bestond, maar draaide nergens in CI.
3. Portal V2 kreeg een extra top-level desktopitem terwijl het bestaande navigatiecontract exact tien items verwachtte; de functie hoorde onder de bestaande Data/Koppelingen-route.
4. De canonical Production Source Snapshot viel terug op `NETLIFY_MCP_PROXY_PATH_TEMP`; de opgeslagen GitHub Actions secret was verlopen en Netlify retourneerde `401 Unauthorized`.

## Fix
- delivery-classifier uitgebreid;
- regressietest gekoppeld aan de website CI-lane;
- Portal-navigatie teruggebracht naar het bestaande 10-item contract;
- productiecredentialfout als expliciete fail-closed releaseblocker behandeld;
- live status pas toegestaan na exact-SHA productie-readback.

## Preventie
Nieuwe tests moeten door minstens één workflow worden uitgevoerd. Nieuwe features hergebruiken bestaande navigatie wanneer logisch. Een tijdelijke Netlify MCP proxy mag niet als duurzame productiecredential worden beschouwd; bij 401 blijft status fail-closed en moet de secret worden vernieuwd vóór een nieuwe promotion.
