# Supabase migration history parity recovery — 5 oktober 2026

Obligation: `supabase-migration-history-parity-20261005-v1`.

## Aanleiding

De post-merge check van PR #3740 meldde dat remote migration versions niet in de lokale migration directory voorkwamen.

## Root cause

Productie was meerdere keren rechtstreeks vooruit gemigreerd zonder dat alle corresponderende SQL-bestanden naar GitHub waren gecanonicaliseerd.

## Uitvoering

- 296 remote-only migratieversies initieel geïdentificeerd.
- Tijdens recovery kwam één extra remote versie-alias bij voor byte-identieke closed-loop-v2 SQL; totaal hersteld: 297 versies.
- Originele SQL per versie teruggelezen uit `supabase_migrations.schema_migrations.statements`.
- De laatste alias `20261005144606` is gekoppeld aan exact dezelfde Git blob als de reeds gemergde `20261005161500` migration; byte-readback was exact gelijk.
- Readback: remote-only = 0.
- Branch protection aangescherpt: `Supabase Preview` is required op `main`, naast Required test en CodeQL.
- Historical surface recovery wordt alleen uitgesloten wanneer de Git blob exact overeenkomt met een gereviewde checksum; gewijzigde historische SQL blijft fail-closed.

## Invariant

Geen productie-Supabase-migratie mag terminal delivery bereiken zolang de canonical repository history die remote versie niet reproduceerbaar bevat.
