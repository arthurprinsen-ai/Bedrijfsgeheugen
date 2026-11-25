# Source Universe: observed truth, not catalog optimism

This read-only assurance probe measures the existing production Source Universe without creating a second crawler, scheduler, source store, tenant view or action writer.

Run `docs/changes/2026-10-08-source-universe-operational-truth.sql` through the authorized server-side Supabase SQL execution path. The result distinguishes catalog registration, activation requirements, historical observations, 24-hour freshness, company impacts and monetary evidence. A public source with `availability_state=AVAILABLE` is **not** proof that it has been fetched. A company impact row is **not** an observed business outcome.

## Required completion gates

1. Public source adapters have real per-source observation receipts and retry/dead-letter visibility; do not update `last_observed_at` without a real observation.
2. Connector-required sources remain unavailable until tenant authorization and readback are proven; never imply 83 integrations are connected.
3. Ingested evidence maps through the existing signal authority to tenant-specific impact. Never create tenant impacts synthetically.
4. Materialize actions only through the existing canonical obligation gate, after READY + SCORED evidence.
5. Actions, verified outcomes and learning each require separate independent receipts; NOOP is not success.
6. Reuse the one Portal Omgevingsradar with the authenticated tenant-scoped API. Enforce existing RLS, no browser service credentials.
7. Required/CodeQL, migration reconciliation, exact-main deploy and authenticated production readback must complete before LIVE_PROVEN.

The SQL is diagnostic and deliberately does not itself activate connectors, ingest providers or alter tenant data.

## Learning/skill-projection herstel — 8 oktober 2026

De originele beschermde PR #4108 (merge `ee9e6b19...`) had wel Required en CodeQL groen, maar de latere canonieke `Powerhouse Skill Projection` stopte op run `37742411908` met `LEARNING_EVALUATION_TEST_PATH_INVALID:historical_replay:[object Object]`. De leerregistratie verwees naar een scenario-object in plaats van een uitvoerbare regressietest. De terminale opvolgcontrole `37756500341` bewees wél live productie-afstamming maar weigerde terecht `LIVE_BEWEZEN` omdat de historische leerprojectie faalde.

Deze beschermde opvolger in dezelfde obligation `source-universe-operational-truth-v1` vervangt het scenario-object door bestaande `tests/brain-source-universe-operational-truth-v1.test.mjs`-paden voor historical replay, shadow en canary en voegt een regressietest toe die een objectvorm opnieuw laat falen. Pas na succesvolle protected merge, nieuwe skill-projectie en canonieke terminal readback wordt deze opvolger als afgerond beschouwd. Geen legacy workflow wordt omzeild of achteraf groen verzonnen.
