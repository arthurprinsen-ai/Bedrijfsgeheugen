# Portal V2 release identity invariant v1

Status: binding
Scope: Portal V2 preview, parity, merge and production verification
Source learning: `brain/learning-ledger/2026-09-09-portal-v2-final-legacy-parity-production-v1.md`

## Invariant
Een Portal V2 release is alleen geldig wanneer checkout, testcode, Netlify preview, browserparity, mergekandidaat en productie-readback aantoonbaar aan dezelfde kandidaat-/release-identiteit zijn gebonden.

Verplicht:
- pull-request preview checkout gebruikt exact `github.event.pull_request.head.sha`;
- direct na checkout wordt fail-closed bewezen dat `git rev-parse HEAD` exact gelijk is aan die SHA;
- Netlify preview wordt uitsluitend geaccepteerd wanneer de deploystatus bij exact dezelfde SHA hoort;
- parity/browsertests gebruiken geen synthetische PR-merge-SHA tegen een preview van de PR-head-SHA;
- runtime readiness wordt bewezen via canonical runtime state (`globalThis.__BG_PORTAL_DOMAIN_STATE__`) plus canonical navigatie/shell state, nooit via zichtbare copy, heading, animatie of viewport-afhankelijke presentatie;
- HTTP-/assetfouten falen gesloten;
- browserruns gebruiken cache-busting waar stale preview-assets anders mogelijk zijn;
- parity-asserties mogen niet worden verzwakt om flakes groen te krijgen;
- merge gebeurt alleen na groene Required, BRAIN, relevante Portal V2 en preview/parity gates op dezelfde kandidaatidentiteit;
- `PRODUCTION_GREEN` mag alleen worden geclaimd na post-merge productie-readback op de echte merge-SHA en canonical productie-URL.

## Machineborging
`tests/portal-v2-release-identity-invariant.test.mjs` bewaakt minimaal:
1. exact PR-head checkout;
2. expliciete checkout-SHA assertie;
3. Netlify status lookup op dezelfde head-SHA;
4. canonical runtime readiness in de parity browserhelpers;
5. verbod op de oude `Welkom terug, Arthur` heading als runtime-ready proxy;
6. cache-busting, HTTP fail-closed gedrag en navigation timeout.

De test is onderdeel van de verplichte `Required test` preflight en mag niet worden verwijderd, overgeslagen of verzwakt zonder een expliciete vervangende invariant met gelijk of sterker bewijs.

## Fail-closed regel
Bij identity mismatch, ontbrekende runtime sentinel, afwijkende deploy-SHA of ontbrekende post-merge readback is de release niet groen. De juiste status is recovery/blocking evidence; nooit `PRODUCTION_GREEN`.
