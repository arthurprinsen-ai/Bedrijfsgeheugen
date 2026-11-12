# Native Supabase 835e migratie — bronregister en beveiligde overdracht

Datum: 12 november 2026. Oorspronkelijke P0: #4198. Geen nieuwe uitvoerder, cron, database-ingreep of auth-wijziging.

## Onafhankelijk vastgesteld
De originele Supabase-productie `adhjwmvyoixzjtmiroln` bevatte op 12 november 19:35:39.196767 UTC **835** toegepaste `supabase_migrations.schema_migrations`-records. De 835e originele versie is `20261112211000 / original_skipped_provider_reference_readback_handoff_v1`. De originele GitHub-lock bevatte nog slechts 834, tot en met `20261112203000 / original_seo_keyword_tenant_alignment_v1`.

De originele SEO-producer PR #5685 stelt een **nieuwe** bronregistermigratie voor, `20261112203500`, die nog niet native is toegepast. Het beveiligde migratiecontract `tools/ci/protected-supabase-pr-migration-tests.mjs` verbood daarom terecht een wijziging van de `applied`-lock in dezelfde nieuwe-migratie-PR (fout `UNEXPECTED_PROTECTED_BASE`). Dit is een beveiligingscontrole, geen reden om hem uit te zetten.

## Herstel als eigen oorspronkelijke providerhistorie-overdracht
Wijzig uitsluitend het bestaande `supabase/migration-history.lock.json` met één exact aangetoonde 835e versie en het werkelijke gecontroleerde tijdstip, behoud de oorspronkelijke 834 byte-identieke `applied`-records, en controleer dit via `tests/brain-original-provider-833-immutable-replay-lock-20261112.test.mjs`. De nieuwe voorgestelde SEO-migratie `20261112203500` blijft buiten de toegepaste lock totdat Supabase hem daadwerkelijk heeft uitgevoerd. Laat de originele beschermde PR/CI/CodeQL-route beslissen en mergen; ga pas daarna verder met dezelfde SEO #5685-branch en één nieuwe base-check.

**Nog niet bewezen:** definitieve SEO #5685-release, native afgeleide SEO-bronregistratie, originele #105-eindreceipt, #140-verwerkte nieuwe revisie of verkeers-/omzetstijging. Deze blijven open.
