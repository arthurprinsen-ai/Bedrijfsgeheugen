# Powerhouse control-plane closure & health authority repair — 2026-09-20

Fingerprint: `powerhouse-control-plane-closure-health-v1`.

## Probleem
ONE BRAIN health controleerde nog de retired schedulernaam `powerhouse-reconciliation-worker-v1`, terwijl productie `powerhouse-reconciliation-worker-v2` uitvoert. Daardoor rapporteerde de architectuur ten onrechte een ontbrekende core-job. Daarnaast kon terminal closure een historische supersession-lineage niet afronden wanneer een gesloten, niet-gemergde voorganger een migratie bevatte die inmiddels onder exact één canonieke same-name identity op current main stond.

## Oorzaak
Runtime-authority en health-contract waren uit elkaar gelopen. De terminalizer behandelde iedere migratie op een gesloten-unmerged predecessor als intrinsiek onveilig, zonder de huidige canonieke main-identiteit te verifiëren.

## Reparatie
De health-view wordt idempotent naar reconciliation worker v2 gemigreerd. De terminalizer accepteert een historische unmerged migration alleen wanneer current main exact één migratie met dezelfde stabiele naam bevat. Geen match of meerdere matches blijft fail-closed.

## Preventie
Authority-version drift moet voortaan door health-contract regression worden gedetecteerd. Supersession recovery gebruikt stabiele migration identity, maar mag nooit ambiguïteit wegredeneren.

## Bewijsgrens
De runtime-hotfix is toegepast, maar volledige terminale status vereist nog protected merge, exacte gates en productie-readback van deze lineage.
