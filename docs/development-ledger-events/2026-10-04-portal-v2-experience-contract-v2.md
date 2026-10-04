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
