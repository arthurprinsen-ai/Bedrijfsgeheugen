# Mira bronkwaliteit: redirect- en zoekbronnen — 8 november 2026

Obligation: `powerhouse|mira|redirect-or-search-url-accepted-as-source|20261108-v1`.

## Aanleiding

De dagwinnaar van 6 november kwam van een google.com-redirect; de radar controleerde alleen titellengte en domein.

## Uitvoering

`mira-source-url-quality.mjs` weigert redirect-, zoek- en linkverkorter-hosts; de radar past dit toe vóór opslag. Drempels voor gezicht (0,940) en temporeel (0,900) ongewijzigd.

## Regressie

`tests/brain-mira-source-url-quality-20261108.test.mjs`. Status OBSERVED tot een natuurlijke radar-run; het niet-claimen van de mediajob blijft apart open.
