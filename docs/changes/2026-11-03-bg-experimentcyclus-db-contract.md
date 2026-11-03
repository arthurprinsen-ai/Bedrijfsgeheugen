# 3 november 2026 — Originele CRO-experimentcyclus, twee databasecontractbreuken hersteld

Oorspronkelijke bronrelease GitHub PR #5360 naar Supabase Edge `bg-experimentcyclus` v9: ACTIVE, exact 7272 bytes, governance `supabase-bg-experimentcyclus-v1` OPENAI / `gpt-5-mini`, oorspronkelijke cron #23 actief zonder extra scheduler.

Live eerste oorspronkelijke POST via pg_net request 19981: HTTP500. Supabase PostgREST trace toont SQLSTATE 2201B. Oorzaak de SQL-regex `{0,299}` (PostgreSQL max 255). Chirurgische bestaande poort-migratie `repair_experimentcyclus_regex_2201b_20261103`: zelfde inputinhoud door `'^/[^?#[:space:]]*$'` én `char_length(v_pagina) <= 300`, zonder regex repetitions >255.

Live herproef 19985: HTTP500, PostgREST SQLSTATE 23502. Oorzaak inserts in `public.social_experiments` vereisen NOT NULL `started_at` zonder default. Chirurgische migratie `repair_experimentcyclus_required_started_at_23502_20261103`: oorspronkelijke poort voegt die ene kolom en `now()` toe aan PLANNED-insert, zonder status, bronregels of toestemmingsregels te wijzigen.

Live derde zelfstandige originele proef request 19987: HTTP200; OpenAI stelde proef `bgx-20261103-d3a13c` voor en de oorspronkelijke database legde deze exact als `PLANNED` vast, met `started_at`. Er is GEEN websiteaanpassing uitgevoerd of omzetclaim gedaan.

Bronbestendige guard: `supabase/migrations/20261103143000_bg_experimentcyclus_regex_started_at_contract_v1.sql` (idempotente gewenste oorspronkelijke DB-functie), regressie `tests/brain-experimentcyclus-db-contract-20261103.test.mjs`, bestaande `.agents/skills/powerhouse-social-cro-funnel/SKILL.md`, leerregel `brain/learning/2026-11-03-bg-experimentcyclus-db-contract-v1.json`. Bron- en runtimeverschil bleef beperkt tot de twee chirurgische SQL-migraties. Andere blokkers (Mira, LinkedIn persoonlijk, blogs, omzet, open incidentachterstand) blijven apart OPEN.

Voor prod-release van dit GitOps-fixbestand: exact-head Required/BRAIN/CodeQL, protected merge en controleer dat de oorspronkelijke Postgres functie gelijk is aan migratie, ook op volgende natuurlijke run. PostgreSQL documentatie bevestigt regex bounds 0–255. Juridische OpenAI cross-border beoordeling bleef apart niet-gecertificeerd.
