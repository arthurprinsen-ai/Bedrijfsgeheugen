# Voorkom vroege mobiele CLS door een nog ongestylede navigatie — 22 oktober 2026

## Bewijs en grens
De echte Netlify-preview voor GitHub Required [#39827594879](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39827594879), browserjob `119996167603`, faalde met drie mobiele (390px) CLS-metingen: `0.248`, `0.103` en `0.121`, alle boven de ongewijzigde norm `0.100`. Alle drie noemen `div.wrap` als verschuivende bron. Dit bewijst de regressie, nog niet de exacte oorzaak.

## Gerichte bronhypothese
In de gedeelde bron `assets/js/menu.js` wordt `#bgSharedMobileNav` dynamisch aan `body` toegevoegd. De bijbehorende `/assets/shared-mobile-drilldown.css?v=1` wordt tegelijk via een separate asynchrone `<link>` geladen. Het bestaande `aria-hidden=true` verbergt het menu voor assistieve technologie maar voorkomt **geen enkele bijdrage aan de layout** wanneer CSS nog ontbreekt. Een ongestyled nieuw blok met meerdere menurijen kan dan vóór de CSS tijdelijk paginahoogte toevoegen. Deze mogelijke oorzaak moet nog door browserreplay worden bevestigd.

## Kleinste wijziging
Zet het echte HTML `hidden`-attribuut op het nieuwe menu **voordat** het element aan `body` wordt toegevoegd. Houd `hidden` actief bij sluiten, Escape en desktop-resize; verwijder het attribuut uitsluitend bij het bestaande bewuste openen. Behoud de huidige focus-, toegankelijkheids-, navigatie- en CSS-contracten.

## Contract, tests en eigenaarschap
- Broncontracttest: `tests/brain-website-mobile-nav-prestyle-layout-v1.test.mjs`; voorkomt een terugval naar alleen `aria-hidden`.
- CLS-drempel blijft **≤ 0.100** op **alle** openbare routes, telefoon/tablet/desktop. Alle checkout-, CodeQL- en Required-gates blijven verplicht.
- Bestaande diagnose-eigenaar [#4651](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4651) behoudt `tools/site-shell/...`; historische header-eigenaar #3651 behoudt `components/header/...`. Deze PR bewerkt alleen het niet-geclaimde menu-script en eigen kennis-/testbestanden.
- Geen tweede cron, scheduler, foutregister, providerfallback of directe productie-override.
- De oorspronkelijke Brain-fingerprint `website|mobile-cls|en-blog-afas-api|20261022-v1` blijft canoniek. De hypothese wordt pas als **PROVEN** gemarkeerd na een echte succesvolle browser- en productiereplay.
- Als de volledige browsercheck rood blijft: niet mergen en de originele CLS-herstelverplichting openhouden.
