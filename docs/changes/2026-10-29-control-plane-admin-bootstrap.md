# Powerhouse Control Plane — app bootstrap, adminidentiteit en logoutisolatie (29-10-2026)

**Fingerprint:** `portal|powerhouse-control-plane|unmounted-owner-ui|20261029-v1`
**Owner:** bestaand Portal V2-app-bootstrap; voor JWT/serverbeveiliging is bestaande exclusieve PR #5156 eigenaar.

## Incident en bron
Bestaande admin-only `portal-v2/control-plane-cockpit.js#mountControlPlaneCockpit` en originele Netlify `/api/powerhouse-control-plane` waren als onderdeel van PR #5150 in de productie-bundle opgenomen. De huidige `portal-v2/app.js`, `page-shell.js` en `native-pages.js` importeerden noch riepen `mountControlPlaneCockpit` aan. De statuskaart kon daardoor onzichtbaar blijven ondanks een geslaagde deploy, ongeacht of server-GETs met JWT slaagden. In Netlify-observability waren eerder 49 anonieme 401's/2 clientdisconnects geobserveerd; dit bewijst geen inbreuk of het gedrag van een specifieke beheerder.

Onafhankelijke auth-reparatie [PR #5156](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5156) werkt de bestaande component- en server-JWT-transportlaag bij, incl. `getUser(request)` en originele rol-gate. Deze change **dupliceert dat niet**.

## Gebouwd in deze branch
- `portal-v2/control-plane-boot.js`: pure lifecycle-adapter op de **bestaande** `portalStateClient.subscribe/getSnapshot/isDemo`; alleen geauthenticeerde Netlify-Identity-**beheerder** (app_metadata rollen) kan een UI-mount krijgen. Gewone klanten/demo/anoniemen starten geen globale admin-read.
- `portal-v2/app.js`: importeert één bestaande `mountControlPlaneCockpit` en roept één `attachExistingControlPlaneCockpit` aan vanuit de authentieke bootstrap. Geen tweede klant/portal app, scheduler, netlify function of persistence.
- Elk browser-request is uitsluitend naar same-origin `/api/powerhouse-control-plane`, met de bestaande JWT-auth uit de oorspronkelijke component **na** merge van eigenaar #5156.
- Bij logout/owner subject-change: AbortController abort, private host verwijderen, achterhaalde/in-flight response plus JSON-parse verwerpen en geen stale cross-tenant DOM. Geen JWT of tenant-ID in logging/URL.
- `tests/brain-portal-control-plane-bootstrap-20261029.test.mjs`: admin vs demo/customer, exact-once mount, logout abort, race met twee subjects, endpoint allowlist en app-import/gebruik.

## Echte bewijsgrenzen
`CODE_WRITTEN` ≠ `PR_REQUIRED_PASSED` ≠ `MERGED_MAIN` ≠ `NETLIFY_DEPLOYED` ≠ `AUTH_ADMIN_BROWSER_200` ≠ `REAL_AGENTS_LEARNED`.
De applicatiebootstrap is een apart, **afhankelijk** herstelstuk van JWT-eigenaar #5156: niet live verklaren voor #5156 beschermd gemerged, volledige Required/BRAIN/CodeQL, System Map regeneratie, eigen beschermd main merge, Netlify exacte commit, **echte adminbrowser** response met alle vijf Supabase-bronnen, 401/403 negatieve controles, en privacy/readback.

Bestaande backend-proof validator [#5148](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5148) is op 29 oktober beschermd gemerged; echte Agent Fabric runtime-consumptie/skills en outcome/proven payment blijven afzonderlijk te bewijzen. Geen nieuwe agents, geen parallelle Heartbeat, geen Make/Buffer fallback, geen false-green of claims van orders.
