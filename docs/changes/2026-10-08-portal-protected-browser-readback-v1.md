# Portal V2: authentieke beveiligingsgrens behouden bij browserpariteit

2026-10-08 · Obligation `portal-v2-browser-proof-protected-trust-20261008-v1` · issue #4215.

## Geobserveerde root cause

De exacte Netlify-release `b3bb56e181b4d49849b2801b14600993d1281738` werd succesvol gepubliceerd, maar de DOM-readback liep op vijf Playwright-tests vast (#37823139950). Vier tests probeerden `compliance-governance` te openen vanuit een anonieme/demo sessie, terwijl `page-shell.js` deze route opzettelijk als protected trust page bewaakt en niet in een demo toegankelijk maakt. Hetzelfde gebeurde op de eerdere release `ebf85e8b44a89867fd7b2f133dda32d58424f312`, run #37819188294: de fout bestond dus al vóór PR #4217.

Daarnaast werd de CSRD-naam gematcht met de eerste menu-knop in plaats van de exacte native pagina-ID, waardoor het dashboard niet noodzakelijk werd geopend.

## Beveiligde reparatie zonder versoepelde toegang

- Browserfixture controleert eerst dat `hasProtectedTrustAccess()===false` én `openPortalPage('compliance-governance')===false` is.
- Alleen daarna wordt in het **afzonderlijk geïsoleerde Playwright-browserdocument** een synthetisch render-only stateClient aangeboden om de opbouw van het bestaande formulier/de berekeningen en mobiele presentatie te controleren. De fixture heeft geen auth-token, schrijft geen klantdata via serverauth en geldt **nooit** als tenant- of providerautorisatiebewijs.
- Een afzonderlijke browsertest faalt zodra een anonieme demo ineens beschermd compliance-materiaal kan openen. De toegangsbeveiliging zelf blijft ongewijzigd.
- Het CSRD-dashboard wordt via zijn expliciete route-ID geopend en op exact `#portalView[data-page-id=csrd-impact] .csrd-cockpit` teruggelezen.
- Volledige live authenticated tenant E2E is een **afzonderlijke verplichte** bewijsgrens van #4215; de mock mag die status niet op groen zetten.

## Bewijslijn

Pre-existing fail: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37819188294

Na merge #4217: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37823139950

Gerichte test: `node --test tests/brain-portal-protected-browser-readback-writeback.test.mjs`, gevolgd door Required + CodeQL + Netlify exact SHA + echte browser DOM readback. Authenticated portal-business-input readback niet afgeleid uit synthetische UI.
