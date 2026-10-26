# Development ledger — migratiehistorie batch 2/2

- Date: 2026-10-15.
- Obligation-ID: supabase-migration-history-reconcile-batch2-20261015.
- Dependency satisfied: PR #4383 beschermd gemerged bij commit `6cec28b051ae0ba5eeedaa2e1645b9f631934b93`; oorspronkelijke 33 provider-migratiebronversies en tien dubbele aliases behandeld.
- Deze PR herstelt zeven historische versiebronnen: 20261014130614, 20261014133344, 20261014140905, 20261014144228, 20261014162635, 20261014163411, 20261014163916.
- Drie oorspronkelijke resterende migraties zijn afzonderlijk naar main gemerged vanuit portaalwerk: 20261014191753, 20261014193133, 20261014195237. Productieledger-SQL is inhoudelijk gelijk na verwijderen van opmerkingen en witruimte; niet overschrijven.
- Originele SQL van de zeven overige versies afkomstig uit productie `schema_migrations.statements`. Geen live database-migraties of migratiehistoriewrites in deze voorbereiding.
- `powerhouse_runtime_mux_task_v1(text,text,integer)` is SECURITY DEFINER, service_role-only. Bronblob vastgelegd als `9609cd69f89dbe746bd36b96b8bb7c0aaeca38f7`; eerdere live ACL-controle anon/authenticated=false, service_role=true.
- Tests: `tests/brain-supabase-migration-batch2.test.mjs` controleert alle tien geregistreerde versies en de zeven nieuwe bronbestanden.
- Resterende blockers: 11 niet-gematchte Git-only migraties beoordelen, vereiste branch-/productiechecks, verlopen Actions SUPABASE_ACCESS_TOKEN, live Edge-versies en publicatiereceipts.
- Geen Green- of verzendclaim vóór provider-success en live readback.
