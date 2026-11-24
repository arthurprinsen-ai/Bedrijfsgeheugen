## 2026-11-19 — CI_REPAIR — migratielock mist migratie connectie-relatiemail (kandidaat)
- **Oorzaak:** migratie 20261119090000 stond in Git en op de provider, niet in de lock.
- **Wijziging:** één regel in de lock; providerreadback via Supabase `schema_migrations`.
- **Lokaal bewijs:** lock-/migratietests groen.
- **Niet bewezen:** exact-head checks, productie-readback na merge.
- **Status:** `CANDIDATE`.
