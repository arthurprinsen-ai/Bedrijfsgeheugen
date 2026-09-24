# Pricing production actionability proof — 24 september 2026

## Observatie
Production deploy `6ab538bfd5da670008277a4d` draaide exact main SHA `be5ec08e69600acfdba31b28af0d6736c84917d6`. Provider build, release identity en pricing-content proof waren groen.

De browserproof vond `[data-bg-stage="loss"]`, maar de directe Playwright-click time-outte op de mobiele 390px viewport terwijl hij wachtte op visible/enabled/stable.

## Root cause
De productieproof klikte horizontaal scrollbare mobiele controls rechtstreeks. Daarmee werd DOM-aanwezigheid verward met bewezen actionability.

## Fix
De verifier:
1. scrollt de relevante sectie/control in beeld;
2. bewijst zichtbaarheid;
3. controleert een niet-nul bounding box;
4. voert een Playwright trial-click uit;
5. voert pas daarna de echte klik uit en controleert de state-change.

Hiermee wordt de proof strenger, niet zwakker.

## Terminal delivery
LIVE_BEWEZEN blijft afhankelijk van exact production SHA/deploy-id plus geslaagde pricing/i18n browserinteraction-proof.
