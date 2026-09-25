# Exact-main production snapshot refresh — 24 september 2026

## Aanleiding

Main `fe158b794b10cdea5c45c281f9669dc642854467` bevat de pricing build-transform cache identity closure, terwijl Netlify production nog een oudere commit serveerde. Er was voor deze main geen Production Source Snapshot gestart, omdat die workflow alleen automatisch triggert wanneer de workflowfile zelf wijzigt.

## Actie

Deze delivery wijzigt uitsluitend een operational refresh-marker in `.github/workflows/production-source-snapshot.yml`. Er verandert geen productgedrag.

De refresh moet:
1. beschermd mergen;
2. de canonieke GitHub OIDC → Netlify production workflow starten;
3. exact de nieuwe main-SHA publiceren;
4. release.json/provider deploy identity teruglezen;
5. de Production Release Readback inclusief pricing/i18n-browserproof groen afronden.

## Preventie

Geen directe productie-bypass. Bij deployment lag zonder snapshot-trigger wordt alleen deze bestaande promotion-route gebruikt, met dezelfde exacte-SHA en browsergates als normale delivery.
