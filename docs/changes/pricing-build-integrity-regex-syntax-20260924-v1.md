# Pricing build integrity regex syntax — 24 september 2026

## Root cause
De Netlify production build voor `0dc124fc2467641ad4c04f6a8ecbfad515b411e1` faalde met exit code 2. Reproductie van exact de `netlify.toml` buildcommand wees naar `tools/site-shell/pricing-build-integrity.mjs`.

Twee `new RegExp(...)`-constructors gebruikten een enkel-gequote JavaScript-string waarin de regex-character-class zowel dubbele als enkele quotes bevatte. Daardoor werd de JavaScript-string voortijdig beëindigd en kon Node het bestand niet parsen.

## Fix
De twee patronen gebruiken nu template literals. De regexsemantiek blijft gelijk.

## Preventie
Nieuwe regressietest `tests/brain-pricing-build-integrity-node-syntax-v1.test.mjs` leest het Netlify buildcommand uit `netlify.toml` en voert `node --check` uit op ieder Node-script in die commandoreeks.

## Terminal delivery
Na protected merge wordt dezelfde Production Source Snapshot opnieuw uitgevoerd. Alleen provider-success + exacte `release.json` SHA/context/deploy-id + productie-browserreadback levert `LIVE_BEWEZEN`.
