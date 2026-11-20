# Fence-transactie voor de growth learning-store

## Wat verandert
- Eén PostgreSQL-functie voert autorisatie (alleen `service_role`), de epoch-controle, de legacy- en v2-sleutelcontrole en de voorwaardelijke insert in één transactie uit.
- De epoch staat als governance-rij `cutover-epoch:growth-learning` in `brain_records`. Schrijvers nemen `FOR SHARE`; een wijziging van de staat neemt `FOR UPDATE` en wacht dus op lopende schrijvers.
- Uitkomsten komen als `Outcome`, leergebeurtenissen als `Memory` in tenant `bedrijfsgeheugen`; de bestaande revenue-learning-trigger (alleen `Learning`) wordt niet geraakt.
- `tools/growth-intelligence/brain-records-store.mjs` verzint nooit zelf een bevestiging.

## Staat bij oplevering
- Fence `INACTIVE`: elke schrijfpoging faalt met `CUTOVER_FENCE_INACTIVE` tot iemand `growth_cutover_set_state('ACTIVE')` aanroept.

## Nog niet gebouwd
- Aanroepers van de engine en de providerverificatie met Mollie.
