# 29 oktober 2026 — voorkom fictieve CRO-bezoekers door Playwright/HeadlessChrome

Fingerprint: `powerhouse|netlify|synthetic-cro-events-preview-cost|20261029`.

## P0 productiebron

Alle vijf gecontroleerde domein-/aliasvarianten geven `HTTP 503` en `{"error":"usage_exceeded","message":"Usage exceeded"}` van Netlify. Het `ready` zijn van een Netlify-merge/deployment bewijst daarom niet dat de website bereikbaar is. Geen alternatieve Netlify-account/site en geen ongeautoriseerde billing-aanpassing.

Netlify Telemetry 29-10-2026 00:00–14:00 UTC toont ongeveer 141k requests, 123.501 HeadlessChrome/149 requests (2,88GB / 33.528 functieaanroepen); meer dan 22k requests op `growth-event`. De druk concentreert zich rond oude GitHub previewdeploys. **De exacte uitgeputte usage-credit en causale billingtrigger moeten door Team PrinsenCo in Netlify Usage & Billing worden bevestigd.**

## Beperkte preventieve codewijziging

De bestaande `injectGrowthMeasurement()` (SEO/CRO site measurement) stopt vóór de eerste browser-/netwerkactie wanneer `navigator.webdriver === true`. Daarmee ontstaat geen `page_view`, `form_start`, `primary_cta_click` of afgeleide Netlify `/api/growth-event`-aanroep voor synthetische Playwright-/HeadlessChrome-sessies. Voor gewone bezoekers blijven bezoekers- en conversiemeting, niet-blokkerende `sendBeacon`, CTA-registratie en privacybescherming onveranderd.

Dit reduceert `growth-event`-functiebelasting bij toekomstig geautomatiseerd verkeer, **niet** de reeds berekende quota, niet noodzakelijk de browserrequests op andere endpoints en niet het gehele 503-incident. De bestaande canonieke Daily Publisher, Required/CodeQL en eenmalige broninventaris blijven aan. Geen agent-/schedulerdubbeling.

## Verificatie en open werk

Contract-/VM-regressie: synthetische browser registreert geen listeners/sessies/netwerk en de huidige browser-/CTA-/formtests blijven succesvol. Protected GitHub + Netlify exact SHA + publieke HTTP 200 is pas uitvoerbaar als de Netlify-accountlimiet is hersteld.

[GitHub incident #5118](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5118) blijft **P0**; de geteste fix mag niet worden verkocht als live of als vervanging voor Netlify's officiële Usage & Billing-herstelroute.
