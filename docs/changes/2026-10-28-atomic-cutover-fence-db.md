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

## Bewijs en productiestatus (23 november 2026)

- Migratie is eerst op productie toegepast (provider-versie `20261123211950`, naam `growth_atomic_cutover_fence_v1`); het bestand en `supabase/migration-history.lock.json` volgen die versie. De oorspronkelijke bestandsversie `20261028220000` was al bezet door `bg_linkedin_lus_v1`.
- Productie teruggelezen: epoch-rij `{state: INACTIVE, epoch: 1}`; beide functies bestaan; execute alleen voor `service_role` (anon/authenticated: nee).
- Echte multi-sessie test op lokale PostgreSQL 16 (13/13 geslaagd): gesloten fence weigert; open fence geeft INSERTED en daarna V2_EXISTS; legacy-sleutel geeft LEGACY_EXISTS zonder v2-rij; 40 gelijktijdige sessies geven precies één INSERTED; een intrekking wacht ≥4 s op een open schrijver en rondt pas af na diens commit; een schrijver na de intrekking krijgt `CUTOVER_FENCE_INACTIVE`; alle geschreven rijen hebben epoch ≤ de ingetrokken epoch.
- Bekende eigenschap: een schrijver die start terwijl een intrekking in de wachtrij staat kan nog onder de oude epoch slagen (geserialiseerd vóór de intrekking).
- Nog open: geen aanroepers van de engine, geen Mollie-providerverificatie (`verifyPayment`), geen legacy-schrijvers om te fencen.
