# 808e toegepaste Supabase-migratie — exact providerbronregister hersteld

Datum 5 november 2026. Eigenaar: oorspronkelijke GitHub Required / Supabase migration-history source-lock. Parent #3742, oorspronkelijke migratie PR #5450, geblokkeerde downstream herstel PR #5457.

## Onbetwistbaar bronbewijs

- Provider `supabase_migrations.schema_migrations`: **808** unieke toegepaste `version/name`-paren.
- Werkelijke originele GitHub `supabase/migrations/*.sql`: **808** bestanden, exact alle 808 provider-versies én -namen.
- Oorspronkelijke `supabase/migration-history.lock.json`: **807** al toegepaste namen, exact de eerste 807 providerhistorie.
- Enige ontbrekende bron-lock-rij: `20261105134200_original_data_spine_decision_receipt_same_tick_v1`, aantoonbaar *reeds toegepast in de originele Supabase-productie*. GitHub PR #5450 was al beschermde gemergd.
- Door deze 807/808-drift faalde de bestaande Required voor een onafhankelijke website/Portal-PR #5457 ([run #42055033207](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42055033207)); eerdere exact-head Required #42053158328 was groen vóór de nieuwe merge.

## Minimale oorspronkelijke broncorrectie

Bijwerken van alléén het bestaande geschiedenis-lockbestand: de 808e `version/name`-rij append-only uit echte providerreadback, datum van bronvastlegging bijwerken, alle eerste 807 rijen byte-identiek behouden. **Geen uitvoerbare SQL aangepast, geen Supabase-migratie uitgevoerd en geen nep-providerregistratie aangemaakt.**

De bestaande strikte tests op `supabase/migration-history.lock.json` blijven van kracht: met name `tests/supabase-migration-history-integrity.test.mjs`, `tests/brain-original-supabase-800-provider-migration-lock-20261104.test.mjs`, `tests/brain-cro-production-migration-lock-20261029.test.mjs` en `tests/brain-protected-supabase-pr-migration-tests.test.mjs`.

## Preventie en first-time-right

Bij iedere beschermde SQL-migratie geldt het onderscheid *voorgestelde PR-source* vs. *daadwerkelijk toegepaste provider-migratie*. Direct na autoritatieve provider-apply moet de bestaande migratie-eigenaar het exacte provider/source/lock-trio verifiëren en de originele lock op dezelfde bronlijfroute append-only synchroniseren, vóór nieuwe onafhankelijke PR's als groen worden gepresenteerd. De source-lock mag nooit vooruitlopen op de provider. Geen tweede migratie-scheduler of omzeiling van immutable history.

Registratie: `brain/learning/2026-11-05-provider-808-migration-lock-source-lag.json` en dit runbook. Status: **CODE_CANDIDATE**, totdat exacte Required/CodeQL, protected merge, en onafhankelijke productiebron-readback zijn geslaagd. Geen andere PR's of agents onterecht groen melden.
