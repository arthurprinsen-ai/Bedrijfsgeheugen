# CRO eventtype-constraint definitieve validatie — 29 oktober 2026

## Aanleiding
De beschermde release #5153 en productiemigratie `20261029182000` hebben bewezen dat dezelfde 17 typen zijn toegestaan in de Edge `bg-interactie` en in PostgreSQL `bg_interacties_gebeurtenis_check`. De laatste SQL-readback was `convalidated=false` vanwege doelbewust `NOT VALID` tijdens de grote tabelmigratie.

## Veilig herstel
Nieuwe, onafhankelijke kandidaat `supabase/migrations/20261029185000_bg_cro_validate_event_types_v1.sql` valideert alle bestaande records met de bestaande CHECK, `lock_timeout=2s` en `statement_timeout=30s`. Deze VALIDATE-controle houdt nieuwe schrijftoegang toegestaan, verwijdert geen rijen, verandert geen RLS, rollen of events en zet de constraint nooit uit.

## Release- en bewijsverplichtingen
Deze file is tot beschermde PR-merge én productiemigratieledger-readback uitsluitend `CANDIDATE`. Controleer Required/BRAIN/CodeQL, daarna `supabase_migrations.schema_migrations` en `pg_constraint.convalidated=true` met volledige 17-type-set. Als het lock-/statementbudget verloopt, herstel veilig via de bestaande writer met oorzaak en nieuwe controle; nooit geforceerde databasewijziging.

## Impact en open zaken
Botverkeer, 202/200 en UID-opslag zijn geen echte commerciële conversie. De opt-in browser→Edge→database→idempotente retry→CRO-ownerportal test en onafhankelijke leads/orders blijven afzonderlijk open. Verwijs naar incident #5141, herstel #5153, ONE BRAIN en bestaande Powerhouse SEO/Growth skills. Geen extra scheduler, geen synthetische klant of omzet.
