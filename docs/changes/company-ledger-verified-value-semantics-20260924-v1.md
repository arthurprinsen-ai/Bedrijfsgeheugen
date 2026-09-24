# Company ledger / Verified Value semantics — 24 september 2026

## Root cause
Verified Value Created introduceerde terecht een strengere eis: alleen uitgevoerde, geverifieerde waarde mét bewijs mag per `PH-Pxxx` als Verified Value Created verschijnen. Diezelfde filter werd echter ook toegepast op het bestaande `economics.realizedValue`-totaal. Daardoor werden geldige historische, geverifieerde waarderecords ineens 0 in bestaande directieprojecties.

## Fix
Er zijn voortaan twee expliciete contracten:
- `economics.realizedValue`: backward-compatible totaal van geverifieerde value-records;
- `verifiedValueByProblem`: strikte evidence-backed waarde, alleen `executed=true`, `verified=true` en minimaal één `evidenceId`.

## Preventie
Een nieuwe strengere afgeleide metric mag nooit stilzwijgend de semantiek van een bestaande aggregate veranderen. De regression test bewijst beide contracten tegelijk.
