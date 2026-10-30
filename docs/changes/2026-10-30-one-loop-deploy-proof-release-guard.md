# ONE BRAIN — verplichte 15-lussenbewijsgate in de oorspronkelijke productie-release
**Datum:** 30 oktober 2026. **Oorspronkelijke eigenaar:** Portal Reliability, Netlify Production Truth, hoofdincident #4918. Dit document is de menselijke uitleg, geen tweede workflow.

## Vastgestelde oorzaak
PR #5181 leverde een nieuwe beveiligde 15-lussencontrole op in dezelfde originele `deploySucceeded`-proef, maar de bestaande `.github/workflows/production-release-readback.yml` controleerde in zijn eindstap nog uitsluitend de **algemene** `PORTAL_AUTHENTICATED_PRODUCTION_PROOF_V1`. Het exacte originele main `9fc929fcb057e6d78686ba287778c293a46a322f` en Netlify READY deploy `6ae458c2f4d6723c8bf2ff5d` zijn echt bevestigd. GitHub productie-readback #41028407937 registreerde `PROVEN` voor twee geïsoleerde tenants met verwijderde testaccounts. De onafhankelijke Netlify-requestlogs registreerden op het originele admin-only pad een werkelijk GET **200** om 08:45:32 UTC, een **403** om 08:45:35 en een anonieme **401** om 08:45:36.

Dit bewijst de HTTP-toegangsgrenzen, maar niet afzonderlijk de **inhoud** van `one_loop_assurance_proof` (de oorspronkelijke productie-readback drukte alleen de generieke velden af). Daarom blijft het inhoudelijke bewijs `UNVERIFIED` totdat een volgende echte originele release dezelfde geneste originele providerproef inspecteert.

## Structurele correctie binnen dezelfde bestaande route
De oorspronkelijke provider-core heeft nu een pure `assertOneLoopProductionReleaseProof`. Alleen exacte originele `one_loop_assurance_proof='PROVEN'` en alle onderdelen (admin true, nonadmin denied true, anoniem denied true, synthetic cleanup DELETED, geen failure_code, **precies 15** niet-negatieve gehele statusaantallen met consistent totaal en onderliggende overall-status) laten het volgende releasebewijs passeren. `RED` als businessstatus is toegestaan, maar geen gefingeerde `GREEN`.

De bestaande GitHub `Production Release Readback` gebruikt deze validator **binnen zijn huidige begrensde provider-readbacklus** en blijft falen wanneer het geneste bewijs ontbreekt, ongeldig of oud is. Er is geen extra scheduler, nieuwe publisher, aparte Netlify-functie, nieuwe BRAIN-store of andere OAuth-/tenant-/CI-beveiliging gemaakt of versoepeld.

## Regels voor alle agents en Portal V2
Onderscheid consequent `source merged`, `Netlify exact commit READY`, `generic portal auth PROVEN`, `15-loop admin auth PROVEN` en `original business guard result`. De bestaande portalrijen tonen dezelfde `powerhouse_loop_assurance_state_v1`; RED en AMBER mogen niet via de releaseworkflow worden opgehoogd. Werkelijke klanten, posts, prospectacties, orders, CRO-experimentuitkomsten en eerste-partij kalibraties vereisen eigen readbacks. Registreer fail-gates via bestaande ONE BRAIN/Heartbeat-incidenten en documentatie.

## Acceptatie
Beschermd Required/BRAIN/CodeQL + historische regressie/shadow/canary, exact merge-SHA, echte originele Netlify productie-release-readback met `one_loop_assurance_proof=PROVEN`, originele Netlify tenant/cleanup-bewijzen en diezelfde status in ONE BRAIN. Zonder echte geneste providerpayload: **EVIDENCE_DUE**, niet live of volledig groen voor die laatste bewijsverplichting. Test: `tests/brain-one-loop-release-terminal-proof-20261030.test.mjs`.

## Vervolg: terminale onafhankelijke productiecontrole is echt geslaagd (09:06 UTC, 30 oktober 2026)

**Dit is een later bewijs dan de bovenstaande historische observatie** van een ontbrekende geneste verificatie. PR [#5184](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5184) is met beschermd Required/BRAIN/CodeQL gemerged naar main `c986ae2a49c09daf349ae365e95c7fbc31a1f8ba`; Netlify productiedeploy `6ae45d9944f9ea2b285e27f3` is READY met **exact dezelfde SHA**.

De originele [Production Release Readback-run #41030754918](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41030754918) is niet slechts een unitmock: de daadwerkelijke originele providerresponse om 09:06:13Z meldde `PORTAL_AUTHENTICATED_PRODUCTION_PROOF_V1=PROVEN`, `one_loop_assurance_proof=PROVEN`, `tenant_scope_verified=true`, `cross_tenant_scope_verified=true`, `tenant_count_verified=2`, `synthetic_user_cleanup=DELETED`; geweigerde toegang voor andere tenant en anoniem is onafhankelijk bevestigd. De oorspronkelijke `public.powerhouse_loop_assurance_state_v1` telde precies **15** lussen: **9 GREEN / 1 AMBER / 5 RED**, dus `overallStatus=RED`. Een geslaagde toegangstest **vereist niet en bewijst niet** dat alle bedrijfsprocessen gezond zijn.

Het bestaande ONE BRAIN-incident `powerhouse|release|generic-portal-auth-certified-without-15-loop-admin-proof|20261030-v1` draagt software-volwassenheid `PROVEN`, maar commerciële, agent-adoptie- en omzetbewijzen zijn aparte verplichtingen. Het gerelateerde CRO-instrumentatie-incident `powerhouse|cro|15-loop-assurance-isolated-from-other-data|20261030-v1` is via CAS als `VALIDATED` vastgelegd met exacte bron-/providerreadback (versie 4). De aparte beveiligde CRO-API `/api/powerhouse-cro-other-data` heeft daarmee **nog geen afzonderlijk geauthenticeerde twee-tenant-E2E-proef**; dat wordt niet afgeleid van de oorspronkelijke `/api/powerhouse-one-loop-assurance`-route. Geen green zonder zo'n concrete aparte proef.

**Herhalingsregel:** alle bestaande release-, agent- en portaalowners controleren de nested providerproof op het exacte live deploy; bewaren oorspronkelijke rode/amber guards, raadplegen de bestaande ONE BRAIN-vingerafdruk en registreren een nieuwe occurrence voor een werkelijke regressie. Niet een tweede scheduler/writer, geen publicatie op basis van Ready, geen aangenomen omzet of betaalde orders. Historische eerdere `OBSERVED`-waarnemingen blijven intact.

