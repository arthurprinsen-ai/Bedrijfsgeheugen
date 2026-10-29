# Ontwikkellog 2026-10-29 — Powerhouse bestaande systeemintegratie zichtbaar
- **Fingerprint:** `portal|powerhouse-existing-system-integration-status|20261029-v1`
- **Owner:** Existing Portal V2 / ONE BRAIN Control Plane.
- **Scope:** één admin-only bestaande cockpitprojectie uit vijf canonieke Supabase read-modelviews, plus regressie.
- **Oorzaak:** de eerdere documentatie bevatte 14 macro-, 32 runtime-lagen en 54 capabilities, maar het bestaande portaal verbond die niet als actuele bronstatus aan gebruikers; daardoor konden `WIRED`, `EXECUTED`, `OUTCOME` en `LEARNED` verwisseld worden.
- **Herstel:** read-only bronprojectie na bestaande adminauth; vijf statussen en bewijsleemten, geen duplicate scheduling/store/writer. De echte handoff-proof wordt door [de bestaande backend-eigenaar PR #5148](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5148) geleverd, hier niet geïmiteerd.
- **Regressie:** `tests/brain-powerhouse-existing-systems-portal-readback-20261029.test.mjs`; fail-closed op gedeeltelijke providerverbinding, overlimiet, null/UNKNOWN, HTML-injectie of ontbrekende tenant-/agent-evidence.
- **Productiestatus:** SOURCE_CANDIDATE — merge, exacte Netlify productiecheck, adminbrowser-readback, learning/writeback en betaalbewijs zijn afzonderlijke verplichtingen.
- **Referentie:** [GitHub #4918 integrale audit](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4918#issuecomment-6503569386).

## CI-admission en Netlify env-bronherstel (29 oktober 2026)
- Source: Netlify project `bedrijfsgeheugen`, alleen sleutelnaam/scope gecontroleerd, geen geheime waarden opgeslagen.
- Waarneming: `SUPABASE_URL` ontbreekt, `BG_PORTAL_EU_SUPABASE_URL` bestaat in Functions/productie en verwijst naar de bestaande projecthost, `SUPABASE_SERVICE_ROLE_KEY` bestaat in Functions-scope.
- Oorzaak: nieuwe projectie keek alleen naar de ontbrekende alias en zou bronbeschikbaarheid onterecht als `PARTIAL` tonen.
- Herstel: binnen dezelfde PR #5150 de bestaande EU-configuratie gebruiken als server-side fallback, ná identity/admin-controle; geen extra variabele of secretaanpassing.
- Preventie: `tests/brain-powerhouse-existing-systems-portal-readback-20261029.test.mjs` faalt wanneer fallback verdwijnt. Protected CI en exacte Netlify/live-admin-readback zijn apart nog vereist.
