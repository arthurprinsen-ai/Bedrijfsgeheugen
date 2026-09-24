# Pricing/i18n terminal production proof refresh — 24 september 2026

## Aanleiding

De runtimefixes voor mobiele lifecycle-tabs en de Netlify deliverylijn waren al gemerged. Eerdere production readbacks leverden echter geen onafgebroken terminal bewijs op: sommige runs werden door nieuwere main-commits gesuperseded, andere classificeerden alleen documentatie en sloegen browserproof over, en één routecontrole overlapte met een nog lopende Netlify-build.

## Recovery

Deze recovery wijzigt geen productgedrag. De canonical `Production Release Readback` krijgt alleen een versioned operational refresh zodat de merge opnieuw verplicht:

1. de exacte nieuwe main-SHA in productie terugleest;
2. de Netlify deploy-identiteit bewijst;
3. `/prijzen` in de productie-browser opent;
4. een echte mobiele click op `Verlies & herstel` uitvoert;
5. de run-tab en yearly billing bedient;
6. via de publieke statische route naar `/en/prijzen` schakelt;
7. pas daarna terminal bewijs afgeeft.

## Preventie

Een technisch groene workflow is nooit voldoende als de relevante browserstap is skipped of cancelled. Functionele productieproof blijft fail-closed.
