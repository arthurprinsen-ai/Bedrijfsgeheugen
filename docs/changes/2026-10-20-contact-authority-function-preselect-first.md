# P0 #4198 / #4215 — preselecteer contactautoriteit voordat de CRM-join start

Datum: 2026-10-20
Issues: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198 en https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Obligation-ID: commercial|contact-authority-preselection-function-first|20261020
Delivery-Lane: backend
Candidate-Type: recovery

## Gecontroleerde productiereden
De live SQL `powerhouse_contact_authority_review_batch_v1(date,integer)` gebruikt nog `WITH candidates` met de volledige enrichment→CRM-join vóór `ORDER BY enriched_at` en `LIMIT`. Productielogs leveren herhaalde `57014` zelfs na de edge-batchbegrenzing van PR #4541. De al protected merged migration `20261020120000_contact_authority_bounded_queue_v2.sql` bevat de correcte `WITH picked AS MATERIALIZED` + `FOR UPDATE SKIP LOCKED` herschrijving, maar het gecombineerde index-DDL liep in productie vast met `55P03`, waardoor de functie ongewijzigd bleef.

## Volgorde structureel herstel
1. **Deze herstelscope** neemt exact het al gereviewde en bron-geankerde function-rewrite-blok over, zonder extra index of cron-operatie. Deze stap is snel, idempotent en houdt binnen één transactie `lock_timeout=2s` en `statement_timeout=12s`. Mislukte bronanker/permissions leidt tot rollback.
2. Laat bestaande scheduler #171 en identity/contact-queue #138 actief; behoud `AUTHORITY_REVIEW_REQUIRED`, `CONTACT_PRESSURE_COOLDOWN` en `powerhouse_email_contact_suppressions` ongewijzigd.
3. Index-creatie op `enriched_at,person_key` uit de al bestaande protected migratie blijft verplicht om de materiële scan te versnellen; probeer die alleen opnieuw na waarneembare drukreductie en lock readback. Idempotente functionherstelstap wordt dan overgeslagen.
4. Check `pg_get_functiondef` na productie, `cron.job`, providerlogs met een echt geslaagde 200-contactreview, geen dubbele sends of consentverruiming, en teruglopende timeouts. Echte klant-HTTP 200 + twee tenant readbacks blijven onafhankelijke P0-gates.

Preview waar de volledige migratie reeds toegepast is mag dit blok idempotent overslaan. Geen claim van groen vóór de echte productietest.
