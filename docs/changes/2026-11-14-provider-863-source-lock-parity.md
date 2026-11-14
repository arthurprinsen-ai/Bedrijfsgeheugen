# 2026-11-14 — Originele Supabase native migratie 863 ↔ GitHub immutable lock 863

P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Dit blijft dezelfde originele native Supabase releaseketen en bestaande ONE BRAIN-route, zonder tweede scheduler of wachtrij.

## Productiebronbewijs
De beschermde bronconsumptie-PR [#5797](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5797) is echt gemerged als `377f114ee8a8ad9f3fdbd6b4dde4132363aea228`, met Required, CodeQL, Supabase Preview en onafhankelijke Readback. Native productie `adhjwmvyoixzjtmiroln` heeft migratie `20261114230000 original_source_consumption_stage_receipt_parity_v1` daadwerkelijk toegepast en rapporteert 863 toegepaste identiteiten. De originele GitHub `supabase/migration-history.lock.json` bevatte 862 en alle 862 voorafgaande `version/name`-paren kwamen exact overeen. Alleen de reeds native toegepaste 863e ontbrak (19:38:33 UTC).

## Eén gerichte lock-overdracht
Append uitsluitend het 863e daadwerkelijk provider-applied paar. Geen productiedatabase-SQL, schema, API-permissie, RLS, cron, inbox, e-mail, AI-provider of uitvoeringsagent bijmaken of opnieuw uitvoeren. Machineleesbare ONE BRAIN-leerregistratie, menselijke documentatie en activiteitenlog horen bij hetzelfde oorspronkelijke P0-incident en worden door de beschermde GitHub-toelating/regressie getoetst.

## Afzonderlijke businessbewijsgrens
De nieuwe bronconsumptiecontrole is na migratie in productie onafhankelijk **`healthy=true`** vastgesteld, met 23.295/23.295 verrijkte connecties, originele stage owner #116 en runtime mux #171, drie non-degraded originele stage-receipts en nul legacy split-crons. Dat toont uitsluitend `ORIGINAL_SOURCE_TO_EXECUTOR_RECEIPT_ONLY` aan. `provider_delivery`, `original_consumer_ack`, `commercial_outcome`, `next_run_learning_application` blijven nadrukkelijk `NOT_ASSESSED_BY_THIS_READ_MODEL`. De zeven rode operationele lussen, oranje outreach-lus en 435 niet-terminalen obligations mogen niet als opgelost worden geboekt.

Verplichte afsluiting: exact-head Required/CodeQL/echte Supabase Preview voor deze lock-only bronwijziging, beschermde merge, onafhankelijke native provider ↔ GitHub-main 863/863 check, registratie in oorspronkelijke issue, geen tweede systeem.
