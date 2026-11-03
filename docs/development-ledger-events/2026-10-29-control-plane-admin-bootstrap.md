# Event — Powerhouse statuskaart was niet gemount (2026-10-29)

Fingerprint `portal|powerhouse-control-plane|unmounted-owner-ui|20261029-v1`.

**Bewijs:** protected main na #5150 bevat de component en de originele serverroute, maar geen call/import in de bestaande hoofdapp `portal-v2/app.js`; inspectie van `portal-v2/page-shell.js`, `native-pages.js`, `owner-operating-system.js` bevestigt dat de main-shell geen mount start. #5156 is bezig met JWT-transport/serverauth en bezit een andere file-set. Er werd niet beweerd dat 401-logs een aanval of persoonsgegevenslek tonen.

**Oorzaak:** nieuwe portal read-model/UI was afzonderlijk gebouwd, maar de app bootstrap/identity lifecycle was niet in dezelfde release-acceptatie meegenomen.

**Herstel:** één bestaande owner-subscription met rol-preflight, originele cockpit-mount, same-origin transport, AbortController en bescherming tegen verouderde user/tenant-responses. Nieuwe helper is geen executor/scheduler/datastore. Exacte regressie in `tests/brain-portal-control-plane-bootstrap-20261029.test.mjs`.

**Voorkomen:** bij nieuw portalcomponent altijd regressie op (1) import/start in werkelijke `app.js`, (2) JWT & admin role in originele request, (3) logout/subject switch, (4) actual 200 browser+provider readback, (5) System Map bronhash, (6) protected main/Netlify release. Alleen na alle gates `PORTAL_ADMIN_READBACK_PROVEN`.

**Open:** #5156 JWT-owner moet eerst beschermd merge, gevolgd door bootstrap-PR protected checks incl. System Map hash, productie-deploy en echte geauthenticeerde readback. Gehele Powerhouse/Heartbeat→Agent→outcome blijft `END_TO_END_UNPROVEN`.
