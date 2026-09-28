# Adaptive Delivery Engine v1

## Waarom

De eerdere GitHub-versnelling verwijderde dubbele lane-tests, herbouwde de website niet onnodig en hergebruikte exacte Netlify previews. De generieke preflight bleef echter voor veel kleine wijzigingen vrijwel dezelfde zware regressies uitvoeren.

## Wat is veranderd

Powerhouse compileert iedere wijziging nu vóór dure CI naar een risicoklasse en capabilities. R0/R1 kan een korte impactroute gebruiken. R2–R4 houdt de volledige gedeelde regressieset. Kritieke bestanden worden als hot-path behandeld en onbekende uitvoerbare paden escaleren fail-closed.

De Test Impact Graph koppelt gewijzigde subsysteemgrenzen aan bestaande historische regressies. Daardoor wordt bewijs geselecteerd op impact in plaats van op een vaste generieke testlijst, zonder merge-, security-, exact-head- of productiebewijs te verzwakken.

## Risicomodel

- R0: niet-uitvoerbare documentatie/learning.
- R1: laag-risico governance/tests/skills.
- R2: bounded runtime en delivery-control-plane.
- R3: productie-runtime zoals portal, website en Netlify functions.
- R4: schema/security/productieautoriteit.

## Borging

De capability is opgenomen in de Brain component registry en in de delivery self-optimization/concurrency skills. De canonical Required test blijft de enige PR-autoriteit.
