# Powerhouse — 15-lussenroute rechtstreeks bewijzen in originele productie-authcontrole
**Datum:** 30 oktober 2026 · **Eigenaar:** bestaande Portal Reliability / Netlify Production Truth · **Incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4918.

## Feiten en oorzaak
De oorspronkelijke ONE BRAIN/Heartbeat/Powerhouse-meting omvat 15 echte lussen; 32/32 lagen zijn aangesloten en 18/18 vereiste jobs actief. Bij live controle op 30 oktober ca. 08:20 UTC waren 8 lussen GREEN, 3 AMBER en 4 RED en waren er twee evidence-debt-runtimefoutstatussen. De 15-lussen-Portal V2-update #5172 staat beschermd op `main`, is gepubliceerd op Netlify en heeft een geslaagde algemene release- en browsercontrole.

**Specifiek bewijs ontbrak:** originele `portal-authenticated-production-proof-core.mjs` probeerde tijdens `deploySucceeded` wel twee onafhankelijke tenant-identiteiten op `/api/portal-ondernemersdata`, maar **niet** de afzonderlijke admin-only `/api/powerhouse-one-loop-assurance`. Een 200 van de algemene portaltest, Netlify READY en een geslaagde browserreplay zijn dus niet genoeg om de toegangscontrole én bronintegriteit van die nieuwe route te bewijzen.

## Herstel in de bestaande architectuur
De bestaande Netlify deploySucceeded-proef wordt uitgebreid, zonder extra scheduler, writer, Edge-functie, database of provider. Tijdelijk aangemaakte accounts A en B zijn officieel admin-owned Netlify Identity-testidentiteiten, met willekeurige sterke wachtwoorden. Alleen A ontvangt tijdelijk de **door Netlify beheerde, getekende app_metadata-rol** `powerhouse-admin`; B blijft een normale tenant. Bij het oorspronkelijke immutable deploy moeten drie aparte uitslagen worden geobserveerd:
1. A: signed admin JWT → HTTP 200, contract `one-brain-original-loop-assurance-readback-v1`, `READBACK_COMPLETE`, 15 unieke originele lussen en consistente 15-telling uit de **originele** Supabase `powerhouse_loop_assurance_state_v1`. De status mag RED zijn; dat is betrouwbare transparantie.
2. B: signed JWT zonder adminrol → HTTP 403 `POWERHOUSE_ADMIN_REQUIRED`.
3. Anoniem: zonder JWT → HTTP 401 `UNAUTHENTICATED`.

Alle testaccounts worden in `finally` verwijderd. Bij mislukte opruiming wordt de volledige bestaande productie-authproef onveilig/FAILED, nooit automatisch groen. De nieuwe geneste `one_loop_assurance_proof` staat op `UNVERIFIED` totdat **alle drie** routebewijzen en cleanup slagen; de oudere, generieke tenantproof mag onafhankelijk PROVEN blijven. Resultaten bevatten alleen aantallen, safe status en bewijsstatus; geen tokens, persoonlijke gegevens of raw serverrows.

## Eén organisme, verschillende bewijsverplichtingen
Originele agentowners en ONE BRAIN blijven exclusief. Echte bronlussen worden **niet handmatig op GREEN gezet**. De eerste-partij private forecast-kalibraties, LinkedIn/Instagram/blog provider-ID's, externe klantuitkomsten, ROI en natuurlijke leertoepassing zijn afzonderlijke vereisten. Ook bij een geslaagde routeproef kan het portaal nog RED laten zien. Dit voorkomt de historische fout dat de 32/32 architectuur ten onrechte als een gesloten omzet-/CRO-lus werd uitgelegd.

## Acceptatie en regressie
Unit-/contracttesten moeten echte admin/nonadmin/anonymous probes, JWT-rol uit ondertekende app_metadata, provider 503 en cleanup-fouten afdekken. Daarna exact protected Required/BRAIN/CodeQL, merge naar main, exact Netlify deploy, originele `deploySucceeded`-receipt en onafhankelijke provider-readback. Een codewijziging of CI-groen zonder natuurlijke Netlify-proef blijft `OBSERVED`. Niet omzeilen: RLS, Identity role claims, provider authorization, publisher duplicate-gates.
