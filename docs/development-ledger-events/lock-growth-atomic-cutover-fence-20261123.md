# 2026-11-23 — MIGRATION_LOCK — growth atomic cutover fence

- **Signal:** migratie 20261123211950 stond op de provider maar niet in de lock.
- **Fix:** één lock-regel na providerreadback (`schema_migrations`: versie en naam exact); geen test aangepast.
- **Boundary:** niet bewezen tot exact-head checks.
