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
