# Portal V2 — finale legacy-parity productiepromotie

Datum: 2026-09-09
Type: RECOVERY / IMPROVEMENT / PRODUCTION_PROMOTION / CONTRACT_CHANGE
Fingerprint: portal-v2-final-legacy-parity-production-v1

## Outcome
De finale geïntegreerde legacy → Portal V2 parity-release is aantoonbaar naar productie gepromoveerd. Portal V2 bevat de executable legacy-algoritmen, berekeningen, canonical datamigratie en native workspace-wiring zonder runtime-afhankelijkheid van het oude portaal.

Release-PR: #1311 — `Portal V2: final integrated legacy parity release`

Kandidaat-SHA: `de171c6ccc402204b6ee634e6cc8a9100c1734ba`

Squash-merge / productie-release-SHA: `2030e72ee7057fd8b860854add8a13eadcab35bc`

Canonical productie-URL: `https://www.bedrijfsgeheugen.nl`

## Inhoudelijke borging
De release bevat en bewijst minimaal:

- executable legacy-calculations in de native V2 analysis/workspace-laag;
- canonical legacy → V2 state migration;
- behoud van reeds canonical V2 state tijdens legacy-upgrade;
- persistente legacy-upgrade op authenticated state load;
- differential/golden-master parity-evidence voor data en algoritmen;
- native V2 workspace-wiring zonder legacy runtime-fallback;
- browserparity op desktop en ondersteunde mobiele viewports;
- productie-readback van Portal V2 DOM, standalone routing en CSRD-assets.

Het oude portaal blijft uitsluitend referentie/rollbackbron; het is geen runtime-dependency van Portal V2.

## Pre-merge releasebewijs
Alle verplichte gates waren groen op exact dezelfde kandidaat-SHA `de171c6ccc402204b6ee634e6cc8a9100c1734ba`:

- Portal V2 Live Preview;
- Required test;
- BRAIN delivery;
- Portal V2 Tests;
- Portal V2 Production DOM Readback;
- Canonical brand shell contract;
- Canonical brand shell full build;
- Canonical brand shell live readback;
- V18 Production Promotion;
- Learning Contract Delivery Classifier Tests;
- Chat learning preflight PR.

Netlify deploy-preview status op de kandidaat-SHA: `success` / `Deploy Preview ready!`.

## Post-merge productie-readback
Na merge is `main` exact op productie-release-SHA `2030e72ee7057fd8b860854add8a13eadcab35bc` gezet.

Daarna draaide de push-triggered workflow `Portal V2 Production DOM Readback` op exact die merge-SHA:

- workflow run id: `34347093454`;
- job id: `102451161589`;
- branch: `main`;
- head SHA: `2030e72ee7057fd8b860854add8a13eadcab35bc`;
- target: `https://www.bedrijfsgeheugen.nl`;
- conclusie: `success`;
- productie-browsertests: `6/6 passed`;
- gecontroleerd: Portal V2 DOM, standalone routing en CSRD-assets.

Daarmee geldt deze outcome als `PRODUCTION_GREEN` en productiegeverifieerd.

## Incident 1 — release-identiteit mismatch in Live Preview
### Probleem
Een eerdere Live Preview-run testte niet dezelfde code-identiteit als de Netlify preview. GitHub Actions checkte standaard de synthetische PR merge-commit uit, terwijl de workflow voor de Netlify preview expliciet op de PR-head-SHA wachtte.

### Root cause
Checkout-identiteit en deploy-identiteit waren niet één invariant. Hierdoor kon de browserlane code/tests van de synthetic merge SHA uitvoeren tegen assets van de PR-head-SHA.

### Oplossing
De Live Preview-workflow checkt expliciet `${{ github.event.pull_request.head.sha }}` uit en verifieert direct daarna dat `git rev-parse HEAD` exact gelijk is aan de verwachte PR-head-SHA. De Netlify preview wordt eveneens op diezelfde SHA geselecteerd.

### Preventieregel
Een releasegate is alleen geldig wanneer checkout, build/deploy, browserpreview en evidence exact dezelfde kandidaatidentiteit gebruiken. Een synthetische merge-SHA en een PR-head-SHA mogen nooit impliciet door elkaar worden gebruikt.

## Incident 2 — visuele heading als runtime-readiness proxy
### Probleem
Na herstel van de SHA-identiteit bleven twee mobiele browsertests incidenteel rood bij de smalste viewport. De boothelper gebruikte de zichtbaarheid van `Welkom terug, Arthur` als readiness-sentinel.

### Root cause
Een visueel DOM-element werd gebruikt als proxy voor applicatie-runtime readiness. Dat koppelde testboot aan viewport/rendering in plaats van aan canonical runtime-state.

### Oplossing
De boothelpers gebruiken de bestaande echte runtime-sentinel:

- `globalThis.__BG_PORTAL_DOMAIN_STATE__` moet bestaan;
- `[data-mobile-nav="overview"]` moet aanwezig zijn.

De inhoudelijke parity-asserties zijn niet verzwakt; alleen de onjuiste readiness-proxy is vervangen door canonical runtime-evidence.

### Preventieregel
Gebruik voor browserboot nooit een zichtbare heading, copy, animatie of layout-node als runtime-ready bewijs wanneer de applicatie een expliciete canonical state/sentinel heeft. Readiness moet semantisch de runtime meten, niet de presentatie.

## Regressieborging
De structurele borging bestaat uit:

1. exact-PR-head checkout in de Live Preview-workflow;
2. fail-closed SHA-assertie direct na checkout;
3. exact-SHA Netlify previewselectie;
4. runtime-ready sentinel in de Portal V2 browserhelpers;
5. executable legacy algorithm parity als verplichte previewgate;
6. executable legacy algorithm parity als productie-readbackcontract;
7. Required, BRAIN en productie-readback als afzonderlijke bewijsbronnen op dezelfde kandidaat/release-identiteit.

## Hergebruikregel voor toekomstige agents
Bij Portal V2 parity-, preview- of productieproblemen geldt deze volgorde:

1. bewijs eerst de exacte kandidaat-SHA van checkout, deploy en testtarget;
2. controleer daarna runtime readiness via canonical state, niet via visuele copy;
3. vergelijk native V2-output tegen executable legacy/golden-master evidence;
4. verander nooit een parity-assertie alleen om een flake groen te krijgen;
5. merge pas wanneer Required, Live Preview, BRAIN en production-readback groen zijn op dezelfde kandidaat;
6. claim pas `PRODUCTION_GREEN` na post-merge readback op de productie-URL en de echte merge-SHA;
7. schrijf fout, root cause, fix, bewijs en preventieregel terug naar dit gedeelde learning ledger.

## Status
`PRODUCTION_GREEN` — finale geïntegreerde legacy → Portal V2 parity-release aantoonbaar live en productiegeverifieerd op release-SHA `2030e72ee7057fd8b860854add8a13eadcab35bc`.
