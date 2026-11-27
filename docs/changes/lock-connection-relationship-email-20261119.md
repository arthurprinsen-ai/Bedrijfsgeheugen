# Migratielock: migratie connectie-relatiemail van 19 nov toegevoegd

Main werd rood nadat #6051 (relatie-e-mailproducer voor goedgekeurde connecties) migratie `20261119090000_connection_relationship_email_activation_v1.sql` toevoegde zonder de lock bij te werken. Besluit Arthur 19 nov 2026: ga verder, zet live.

- Providerreadback (Supabase `schema_migrations`, project `adhjwmvyoixzjtmiroln`, 19 nov 2026): `20261119090000 connection_relationship_email_activation_v1` staat als laatste toegepast; de functie `powerhouse_prepare_connection_relationship_email_v1` bestaat.
- `supabase/migration-history.lock.json`: die ene regel toegevoegd en `captured_at` bijgewerkt. Geen test aangepast of overgeslagen.
- Lokaal: de lock-/migratietests groen.
- Niet bewezen: exact-head checks op de PR en productie-readback na merge.
