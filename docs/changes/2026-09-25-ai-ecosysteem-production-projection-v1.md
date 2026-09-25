# AI-ecosysteem — productie-borging

Datum: 25 september 2026
Fingerprint: `website|generated-canonical-surface|post-build-projection|v1`

De AI-ecosysteempropositie verbindt bedrijfsdata, kennis, systemen, processen en AI-agents via Powerhouse als bedrijfsbrein. De landingspagina `/ai-ecosysteem` bestaat al; deze recovery borgt dat de homepage-propositie de echte V18-productiebuild overleeft.

De productiebuild herstelt eerst een pinned homepage. Daarom is een losse wijziging in `index.html` geen duurzame authority. De oplossing projecteert de AI-ecosysteemsectie idempotent ná die restore en test expliciet dat de production builder de projectie aanroept.

De delivery-regel is fail-closed: een open PR, groene deelchecks of een gestart deploy zijn geen LIVE-bewijs. LIVE vereist protected merge, exact production identity en functionele route/readback. Learning, development ledger, documentatie en Powerhouse/System Map writeback horen bij dezelfde closure.
