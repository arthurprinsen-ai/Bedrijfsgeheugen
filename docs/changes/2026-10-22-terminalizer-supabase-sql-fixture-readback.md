# Terminalizer: SQL-regressiefixture is geen aparte productiedeployment — 22 oktober 2026

## Waargenomen storing
De enige bestaande Powerhouse Obligation Terminalizer faalde na protected merge van [PR #4697](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4697), GitHub run [39833808183](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39833808183) / job `120016707966`, met `UNWIRED_NON_NETLIFY_RUNTIME_READBACK` en exit 78 voor `supabase/tests/brain_failure_observe_semantic_recovery_v1.sql`. De bronmigratie `20261022173500_brain_failure_observe_semantic_guard_v1` en beveiligde `brain_observe_failure` zijn onafhankelijk in Supabase-productie bevestigd. Die productiereadback bewijst de bronfix, **niet** de terminale afsluiting.

## Kleinst veilige reparatie
Gebruik uitsluitend de bestaande `brain/contracts/production-readback-v1.json` en `tests/brain-terminalizer-quality-surface-governance-v1.test.mjs`. Voeg exact dit ene SQL-testbestand toe aan `productionTruth.verifierOnlyPaths`. Het is regres­sie-/acceptatiebewijs, geen uitvoerbare migratie of Edge Function. Geen generieke `supabase/`, `supabase/tests/` of `supabase/migrations/` uitzondering. Geen nieuwe scheduler, owner, gegevensopslag of release-route.

De bestaande terminalizer moet `supabase/migrations/<version>_<name>.sql` nog altijd als echte productiewijziging classificeren en de provider `APPLIED` readback afdwingen. Onbekende paden blijven geweigerd.

## Regressie en release
Het bestaande Node-testbestand bevat een positieve controle op exact de fixture en negatieve controles voor onbekende SQL, andere testfiles, Edge runtime en echte migrations. Gebruik exact-head Required + CodeQL en beschermde merge. De terminale replay voor oorspronkelijke PR #4697 blijft apart onvoltooid totdat de bestaande terminal owner werkelijk een succesvolle provider/ACL/migration/learning-readback heeft gelogd. Niet melden als `LIVE_BEWEZEN` op basis van dit voorstel.

**Canonieke fingerprint:** `delivery|terminalizer|supabase-sql-test-fixture-unwired-readback|20261022-v1`.
**Herbruikbare eerdere les:** [#4089](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4089) over de verifier-only Supabase migration-history lock; zelfde foutklasse, nieuwe exacte testfixture.
