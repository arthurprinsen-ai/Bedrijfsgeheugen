# Originele LinkedIn-persoonlijk reconciler: SQL-syntaxisfout veilig herstellen

Datum: 4 november 2026. Herstel hoort bij de bestaande eigenaar `original-ONE-BRAIN-content-reconciler`, eerdere PR #5382 en centraal incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Diagnose
Een onafhankelijke, door de nieuwe recovery-PR #5381 getriggerde Supabase-preview van bijgewerkte `main` stopte met `SQLSTATE 42601` bij `REVOKE`. De eerdere migratie `20261104052001_original_personal_reconciler_nested_builder_proof_v1.sql` eindigde het `CREATE OR REPLACE FUNCTION`-lichaam met `$function$` zonder afsluitende SQL-puntkomma. Daardoor werden de oorspronkelijke service-only rechten en de reeds gemergede functie nooit als volledige migratie verwerkt.

## Fix, bewaking en scope
Het bestaande bronbestand krijgt uitsluitend `$function$;` waar de terminator ontbrak. De bestaande test `tests/brain-personal-reconciler-nested-builder-proof-20261104.test.mjs` controleert het exacte contract en de originele `REVOKE`/`GRANT`-rechten. Niets wijzigt aan bedrijfstekst, bronidentiteit, originele publisher, providerrechten, media, cron, tokens of publicatiereadback.

De bestaande ONE BRAIN-agent detecteert dezelfde fout voortaan als `SQL_FUNCTION_TERMINATOR_MISSING_BEFORE_ACL`, laat het oorspronkelijke incident open tot providerbevestiging en leert de syntaxisregressie in zijn skill. Een PR-merge zonder onafhankelijke productie-migratiebewijzen is géén voltooide uitrol; onjuiste, dubbele of onbewezen posts blijven geblokkeerd.

## Afsluitregel
Verplicht: oorspronkelijke schrijflease, exacte source SHA, BRAIN/Required/CodeQL/native Supabase Preview, beschermde merge, productie `supabase_migrations.schema_migrations` versie `20261104052001`, `pg_get_functiondef` en service-role-only ACL, echte volgende oorspronkelijke content-run. Geen previewbranch verwijderen zolang deze nog een open PR bedient; geen nieuwe betaalde preview zonder expliciete goedkeuring.
