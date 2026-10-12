# Portal V2 — productiecontrole corrigeren na gewenste positioneringswijziging

Op 12 oktober is PR #4347 beschermd gemerged en gepresenteerd op de exact verifieerbare Netlify productiedeploy `6accb2b9f4de3f939ce63151`. De portaalroute is in onafhankelijke HTML- en browser-readback inhoudelijk correct: één sturingsroute van signalen naar bewijs, voorbeeld-KPI's alleen demo, bestaande native navigatie intact.

De verplichte aanvullende workflow `portal-v2-production-dom-readback` liep daarna op twee **verouderde tekstasserties** vast. Beide controleren nog de tekst 'Portal V2 bevat alle portalonderdelen standaard', die bewust in de all-pages drawer vervangen is door de klantgerichte 'Alle onderdelen van je ondernemingssturing'.

## Correctie
Werk uitsluitend die twee Playwright-asserties bij naar het daadwerkelijk bestaande, unieke, zichtbare portaal-h2 'Wat verandert er in je bedrijf — en wat doe je ermee?'. De all-pages drawer mag geen oude slogan terugkrijgen. Behoud alle beschermde checks: directe Portal V2-pagina's, geen `/klantportaal` of `/portal-next` netwerkverzoeken, native router, mobiele viewports en tenant-/trust-gates.

## Afsluiting
Test `tests/brain-portal-production-dom-title-parity-v1.test.mjs` borgt de selector en checks. Daarna protected CI, merge, Netlify-exact-SHA, volledige productie-readback met 16/16 niet-overgeslagen relevante checks of expliciet onderbouwde reststatus. Geen fictieve omzet of klantuitkomst claimen.
