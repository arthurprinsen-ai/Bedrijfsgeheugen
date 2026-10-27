# Portal V2 Experience Contract v2 — development ledger

Datum: 2026-10-04
Obligation: portal-v2-experience-contract-v2
Fingerprint: portal-v2-responsive-end-to-end-v2

De bestaande Portal V2 Experience Contract is uitgebreid in plaats van een tweede product-experience stack toe te voegen. Visual assurance test voortaan 24 combinaties en bewaakt 320px narrow-mobile, overflow, touch-targets en runtime experience-signalen.

Backend-authority en Portal State blijven ongewijzigd. Productiestatus vereist protected merge, exacte Netlify main-deploy en productie/browser-readback.


## CI recovery
De eerste consolidatie-runs legden twee contractfouten bloot: ongeldige PR-machine metadata en letterlijke newline-escapes in twee testbestanden. Beide zijn op dezelfde obligation hersteld zonder UX-, overflow-, touch- of backenddrempels te verlagen. Nieuwe gates moeten uitsluitend de actuele branch-head beoordelen.


## Cache-boundary recovery
De v2-assets zijn expliciet naar `?v=20261004-2` gezet zodat preview en productie de gewijzigde experience CSS/JS niet uit een v1-cache kunnen hergebruiken. De eerste Required-run na deze wijziging startte vóór de bijgewerkte PR Change-Scope zichtbaar was en classificeerde `portal-v2/index.html` daarom terecht als onverwacht; de canonieke PR-scope bevat dit bestand nu expliciet.


## Hydrated mobile readback recovery
De exact-head browserreadback op 390×844 vond na asynchrone demoAI-hydration een topbar van 263.375px tegenover de harde grens <260px. De herstelmaatregel verkleint uitsluitend verticale shell-spacing in de finale experience authority; kritieke controls blijven minimaal 44px. De CSS-cacheversie is verhoogd zodat preview en productie exact de herstelde authority laden.


## Narrow-phone menu target recovery
De exact-head browserpariteit vond op een ondersteunde telefoonbreedte een menutoggle van 43px breed. De finale experience authority forceert daarom de canonieke mobiele menuknop op minimaal 44×44px, ook wanneer het tekstlabel op narrow-mobile wordt ingeklapt. Dit verhoogt de touch target zonder de compacte topbar opnieuw groter te maken.


## Terminale productieproof
- Status: LIVE_BEWEZEN / LIVE_PROVEN_RUNTIME
- Delivery PR: #3692
- Protected main: 392ec658131c01824712d83c83e41d36a3633575
- Netlify production deploy: 6ac25d5a4e893200088ae19b — ready
- Productie: https://www.bedrijfsgeheugen.nl/portal-v2/
- Required Test: 37207574172 — success
- Portal V2 DOM readback: 37207574039 — success
- Portal Visual Density: 37207574040 — success
- CodeQL: 37207574054 — success
- Skill Projection: 37208029113 — success
- Terminal closure: 37208029345 — success

Daarmee is de v2 assurance niet langer een candidate. De productie-readback en de machine-governance wijzen naar dezelfde terminale waarheid.
