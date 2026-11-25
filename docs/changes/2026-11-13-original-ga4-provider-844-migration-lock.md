# 13 november 2026 — exact toegepaste Supabase-migratie 844 in oorspronkelijke bronlock

## Waarom de automatische release na de reparatie nog geblokkeerd was

De oorspronkelijke content-handoff SQL-fout `22P02` is in [PR #5733](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5733) beschermd opgelost. De native Supabase-integratie heeft daadwerkelijk versie `20261113121500` met exacte providernaam `original_ga4_handoff_json_operator_precedence_v1` toegepast in productieproject `adhjwmvyoixzjtmiroln`. Productiereadback: **844 provider-migraties**, echte `pg_get_functiondef` bevat de afgeschermde GA4 JSON-tekstoperatoren, originele `brain_content_handoff_terminal_proof_guard_v1` blijft ingeschakeld; `anon` en `authenticated` hebben geen EXECUTE en `service_role` wel.

De oorspronkelijke ONE BRAIN postmerge-run [#43425411400](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43425411400) blokkeerde nog 17 regressies over providerbron-lockpariteit omdat `supabase/migration-history.lock.json` bewust nog 843 records had. Die file was oorspronkelijk correct **vóór** de productie-apply. Dit is geen reden om een toekomstige migratie als al toegepast te registreren; na onafhankelijke echte provider-readback is **precies de feitelijk toegepaste** 844e identiteit wel terecht.

## Herstel binnen één originele GitOps-keten

Update uitsluitend `supabase/migration-history.lock.json` door record `{version:"20261113121500",name:"original_ga4_handoff_json_operator_precedence_v1"}` achter de onveranderde 843 reeds bewezen records toe te voegen. `captured_at` komt uit echte Supabase-query op `2026-11-13T12:33:20.358846Z`. Geen tweede SQL-migratie, hotfix, extra scheduler, providerpost, contact of datawijziging. De echte bronfout is al in productie gecorrigeerd en de oorspronkelijke cron #171 blijft actief.

Regressie `tests/brain-original-ga4-provider-844-migration-lock-20261113.test.mjs` controleert exact 844, unieke gesorteerde migratie-identiteiten, echte bron-SQL en originele trigger. Machinevoorkomen via `brain/learning/2026-11-13-original-ga4-provider-844-migration-lock-v1.json`; ledger `docs/development-ledger-events/2026-11-13-original-ga4-provider-844-migration-lock.md`.

## Vereiste acceptatie

Beschermde Required/BRAIN/CodeQL op deze exacte PR-head, merge naar origineel `main`, daarna onafhankelijke productieprovider-count+naam+functie+trigger-readback en succesvolle nieuwe ONE BRAIN-terminalcontrole. Productiefoutvrije consumer-run van 84 bronverplichtingen is **niet** hetzelfde als alle 365 originele open handoffs of 184 open social-learning vensters afsluiten. Content-closed-loop blijft RED zolang de bestaande guard echte ontbrekende producer/provider/measurement/action/outcome/learning bewijzen detecteert. Bestaande cron #171 en #177 blijven actief; geen parallelle writer of fake FULL_GREEN.

Oorspronkelijke centraal incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
