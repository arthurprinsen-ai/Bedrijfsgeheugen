# Portal V2 — release identity hardening

Datum: 2026-09-09
Type: CONTRACT_CHANGE / PREVENTION
Fingerprint: portal-v2-release-identity-hardening-v1

## Aanleiding
De finale legacy-parity release is productiegeverifieerd en het incident is eerder vastgelegd. Deze vervolgwriteback maakt de preventie bindend en machine-afdwingbaar zodat toekomstige agents dezelfde fout niet opnieuw kunnen introduceren.

## Harde borging
Toegevoegd:
- `brain/contracts/portal-v2-release-identity-invariant-v1.md` als bindend releasecontract;
- `tests/portal-v2-release-identity-invariant.test.mjs` als machinecheck;
- `Required test` voert deze invarianttest voortaan standaard uit in de preflight.

## Beschermde invarianten
- checkout, preview, browserparity en evidence moeten dezelfde PR-head-SHA gebruiken;
- checkout-SHA wordt expliciet fail-closed gecontroleerd;
- Netlify previewstatus moet bij exact die head-SHA horen;
- browser-runtime readiness wordt via canonical runtime state bewezen, niet via zichtbare copy;
- cache-busting en HTTP fail-closed checks blijven verplicht;
- productie mag pas `PRODUCTION_GREEN` heten na post-merge readback op de echte merge-SHA.

## Preventieregel
De eerdere failure mode mag niet als losse kennis blijven bestaan. Iedere toekomstige wijziging die exact-SHA binding, runtime-sentinel, fail-closed HTTP-checks of post-merge production evidence verwijdert/verzwakt, moet door `Required test` rood worden voordat merge mogelijk is.

## Hergebruik
Toekomstige agents lezen eerst het bindende contract en de bestaande learning fingerprint voordat zij Portal V2 preview-, parity- of releasecode aanpassen. Een bekende mislukte aanpak mag alleen opnieuw worden geprobeerd wanneer nieuwe evidence aantoonbaar maakt dat de oorspronkelijke root cause niet meer geldt.
