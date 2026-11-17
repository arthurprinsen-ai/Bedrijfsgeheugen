# 17 november 2026 — P0 GitOps-bronlock ontbreekt één native provider-identiteit

**Root fingerprint:** `github|gitops|provider-878-applied-with-missing-lock|20261117-v1` — originele GitOps owner / ONE BRAIN #4198.

**Waarneming:** Native Supabase productie `list_migrations` gaf 878 versies. De originele `supabase/migration-history.lock.json` had 877 versies. Alle eerste 877 zijn exact gelijk in volgorde, versie en naam. Alleen de werkelijk toegepaste `20261117110000_original_guardian_news_source_provider_truth_v2` ontbreekt. De bestaande preflight van https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44063305193 faalde exact hierdoor. Bron-SQL bestaat al op main, blob SHA `74b006ec743a93487b91d02fbb12d8913edeb077`.

**Herstelkandidaat:** voeg uitsluitend provider 878 versie/naam en feitelijke controletijd toe aan één originele GitOps-bronlock. Geen DDL, nieuw runner, nieuwe scheduler, privileges, e-mail-/socialactie of vervalste testbewijzen.

**Borging:** protected Required/CodeQL, provider-source parity en bestaande `tests/brain-cro-production-migration-lock-20261029.test.mjs`, `tests/brain-original-supabase-800-provider-migration-lock-20261104.test.mjs`, `tests/brain-production-supabase-790-provider-source-parity-20261102.test.mjs`, `tests/brain-supabase-migration-lock-provider-20261029.test.mjs` en `tests/supabase-migration-history-integrity.test.mjs` opnieuw.

**OPEN tot bewijs:** beschermd exact-head merge + current-main/production 878 readback. Vervolgrelease oorspronkelijke #5949 moet daarna opnieuw exact getest. Externe publishing en businessresultaten blijven afzonderlijk onbewezen.
