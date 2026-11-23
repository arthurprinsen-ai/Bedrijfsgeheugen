# Migratielock: growth atomic cutover fence — 2026-11-23

Migratie `20261123211950_growth_atomic_cutover_fence_v1` (#5051) is op de provider toegepast en teruggelezen, maar stond nog niet in `supabase/migration-history.lock.json` (een PR mag de lock niet vooraf declareren). Eén regel toegevoegd na providerreadback; geen test aangepast. Niet bewezen: exact-head checks van deze PR.
