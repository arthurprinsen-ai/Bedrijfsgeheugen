# Beschermde Supabase migratielock herstellen na zelfstandig bevestigde 870e provider-migratie

15 november 2026. P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

De **bestaande** native Supabase-bron (`adhjwmvyoixzjtmiroln`) meldt **870** werkelijk toegepaste migraties. De door GitHub `main` beschermde `supabase/migration-history.lock.json` meldde **869** migraties. Onafhankelijke exacte vergelijking van alle 869 versies én namen bevestigde dat de lock een zuiver prefix van de originele provider is. Exact één provider-applied versie ontbrak: `20261115162500_original_personal_source_supplier_completeness_v4`, waarvan de oorspronkelijke executable SQL al op protected `main` staat.

De oorspronkelijke Powerhouse innovatie-reparatie-PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5879 stelt juist een **nieuwe nog niet toegepaste** `20261115235500_sales_action_reexecution_immutable_attempt_lineage_v1.sql` voor. De originele triple-source-paritycontrole heeft deze PR correct geblokkeerd omdat de andere, al toegepaste 870e migratie in het immutable lockdocument ontbrak. Dat is geen aanleiding om de beveiligingscheck over te slaan.

Deze **aparte, beperkte bronregistratiereparatie** voegt uitsluitend de live bevestigde 870e provider-identiteit toe aan hetzelfde lockdocument en registreert bewijs en de oorzaak in de bestaande Brain, documentatie, ledger en oorspronkelijke agent-skill. Er wordt geen migratie toegepast, geen oude migratie herschreven, geen tabel aangepast, geen SQL-privilege verleend en geen parallelle uitvoerder of scheduler gemaakt.

Acceptatie: protected Required/CodeQL en oorspronkelijke volledige `tests/brain-cro-production-migration-lock-20261029.test.mjs` plus `tests/supabase-migration-history-integrity.test.mjs` groen, vervolgens lock-to-native provider opnieuw uitlezen (870/870, exact alle identiteit). Dán pas de oorspronkelijke onveranderlijke uitvoerings-PR #5879 veilig synchroniseren en opnieuw laten toetsen. De 871e `20261115235500` blijft **niet toegepaste kandidaat** tot afzonderlijke native migratiepublicatie en eigen readback. Geen autonome agent-ACK, extern providerresultaat of geldbesparing geclaimd.

Rollback: oorspronkelijke beschermde GitHub-route. Geen wijzigingen aan live historie zonder werkelijke provideridentiteit.
