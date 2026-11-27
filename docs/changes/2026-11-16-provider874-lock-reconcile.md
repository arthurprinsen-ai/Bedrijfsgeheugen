# 16 november 2026 — native Supabase provider 874, originele bron-lock bleef 873
Original parent #4198: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Original migration owner #5919: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5919

## Aanleiding
De oorspronkelijke beschermde Required-preflight voor juridische PR #5921 (run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43845430541) blokkeerde op de historische versielock. Nieuwe originele `supabase/migrations/20261116105000_original_infinity_missing_signal_isolated_mux_v3.sql` was inmiddels op `main` beschermde merge, maar `supabase/migration-history.lock.json` bevatte slechts 873 records. Daardoor faalde onder meer `tests/supabase-migration-history-integrity.test.mjs` met Unexpected local-only executable migrations. Het falen is onafhankelijk van de juridische inhoud en LinkedIn-herstel.

## Onafhankelijke productie-waarheid en minimale fix
Live SQL via originele Supabase-connector `supabase_migrations.schema_migrations`, geobserveerd `2026-11-16T10:07:54.646910Z`: **874** provider-toegepaste versies; hoogste versie `20261116105000`; exacte naam `original_infinity_missing_signal_isolated_mux_v3`; één uniek catalogusrecord. Originele Git-lock laatste versie vóór fix: `20261115235900/company_intelligence_existing_daily_source_receipt_v1` (873 records). Exact één reeds toegepaste `version/name` toegevoegd en `captured_at` gelijkgesteld aan echte SQL-readback. Verder geen SQL/schema-migraties, ACL's, functiecode, schedulers of tools gewijzigd. Source: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/blob/main/supabase/migrations/20261116105000_original_infinity_missing_signal_isolated_mux_v3.sql .

## Permanente veiligheid
De originele historische lock blijft strikt provider-applied, nooit een voorspelling. Andere provider IDs worden niet aangepast. `tests/brain-original-provider874-lock-reconcile-20261116.test.mjs` bevestigt 874 exacte unieke identities, executabele bronfile en originele bestaande v3-mux fail-closed beveiligingen. De bestaande `tests/supabase-migration-history-integrity.test.mjs` blijft volledig aan.

## Terminal
Code candidate. Eerst protected Required/CodeQL, protected merge, native Supabase source count readback, opnieuw exacte `main`-lock, en vervolgens de onafhankelijke juridische PR #5921 en LinkedIn PR #5917 via hun eigen beschermde tests en originele runtime readback. Geen nieuwe schema-mutatie door deze PR; geen vals bewijs van persoonlijk LinkedIn-publicatie.
