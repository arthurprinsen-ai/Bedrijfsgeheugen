# Originele Supabase-migratiegeschiedenis — 879e provider-versie

**Datum:** 17 november 2026. Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

De oorspronkelijke SQL-composer-timeoutreparatie is beschermd gemerged in PR #5957 (https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5957) en onafhankelijk in de oorspronkelijke Supabase-productie aangetroffen: versie **20261117123000_original_composer_bounded_fair_candidate_v2**. Native RPC-proef: 52,55 ms; oorspronkelijke natuurlijke Heartbeat-verwerking op 12:37 UTC: HTTP 200, processed=5, passed=0. Dit bewijst uitsluitend technische verwerking.

Het originele Git-bronregister had op dezelfde actuele main nog 878 versies (laatste 20261117110000), terwijl originele Supabase provider 879 had. Hierdoor blokkeerde de strikte, juiste migratieregressie in PR #5958 een nieuwe originele Guardian-migratie. Deze eigen afgebakende reconciliatie voegt **alleen één al toegepaste provider-versie** toe aan `supabase/migration-history.lock.json` en verifieert dat er geen nieuwe SQL-migratie, helper, cron, mailtransport of schrijfbevoegdheid wordt aangemaakt. De nog niet uitgerolde originele Guardian-v3 versie **20261117124500 wordt niet voorgeregistreerd**.

Na beschermde merge kan de originele #171 Result Guardian-v3 candidate #5958 als **gewone nieuwe migratie** tegen de correcte provider-bronpariteit worden getest. De e-mailketen blijft DEGRADED bij ongeldige bron/0 echte Gmail-provider-ID's. Dit registerherstel is geen commerciële prestatieclaim.
