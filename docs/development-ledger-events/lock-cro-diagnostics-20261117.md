## 2026-11-17 — CI_REPAIR — migratielock mist CRO-diagnostiekmigratie (kandidaat)
- **Oorzaak:** migratie 20261117162500 stond in Git en op de provider, niet in de lock (879 tegen 880).
- **Wijziging:** één regel in de lock; providerreadback via Supabase `list_migrations`.
- **Lokaal bewijs:** zeven lock-/migratietests groen.
- **Niet bewezen:** exact-head checks, productie-readback na merge.
- **Status:** `CANDIDATE`.
