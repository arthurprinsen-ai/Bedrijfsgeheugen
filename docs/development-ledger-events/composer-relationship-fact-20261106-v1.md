# Composer relatiefeit (besluit 27 okt) — 6 november 2026

Obligation: `composer-relationship-fact-20261106-v1`.

## Aanleiding
Het besluit van 27 okt 2026 stond niet in de composer; de bronpoort accepteerde alleen nieuws met https-bron.

## Uitvoering
`composerSourcePreflight` accepteert ook minimaal twee verifieerbare relatiefeiten (functie, bedrijf, eerder gesprek, status in_gesprek). Alle andere kwaliteitspoorten zijn ongewijzigd.

## Regressie
`tests/brain-composer-relationship-fact-20261106.test.mjs`. Niet live tot merge en Edge-deploy; geen verzending bewezen.
