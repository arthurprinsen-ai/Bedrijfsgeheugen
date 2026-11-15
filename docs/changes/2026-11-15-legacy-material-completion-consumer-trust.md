# ONE BRAIN — oude zelfgecertificeerde afronding bij de ontvanger weigeren

**Datum:** 15 november 2026  
**Bestaand P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Oorzaak en bewezen reikwijdte
De eerste beschermde fix https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5851 heeft het automatisch schrijven van `OBLIGATIONS_COMPLETE` met `accepted/independent/exact_production=true` vanuit de oorspronkelijke `tools/outcome-obligation-runtime.mjs` verwijderd. De **bestaande consument** `platform/agents/completion-supervisor.mjs` vertrouwt dezelfde claimant-producent `OUTCOME_OBLIGATION_RUNTIME` nog steeds via `TRUSTED_PRODUCERS.OBLIGATIONS_COMPLETE` en kan historische reeds opgeslagen records daardoor alsnog als onafhankelijke afronding gebruiken.

Native productie-SQL bevestigt **328** historische, onveranderlijke `OBLIGATIONS_COMPLETE`-records van deze producer met alle drie bewijsflags op `true`, voor het originele `material-change-live-verification`-onderwerp. Dit bewijst een vertrouwensregeldefect, niet dat alle 328 feitelijke resultaten onjuist waren of provideracties dubbel plaatsvonden.

## Eén oorspronkelijke keten, ook bij herhaling
De originele `Completion Supervisor` aanvaardt voor `OBLIGATIONS_COMPLETE` alleen `PRODUCTION_READBACK` als afzonderlijke productiebron, met `exactProduction=true` en de expliciete, niet-lege `metadata.materialSourceRef` en `metadata.materialSourceRevision`, plus de bestaande exacte `taskIdentity,candidateIdentity,productionIdentity`. De oorspronkelijke claimant `OUTCOME_OBLIGATION_RUNTIME` kan de onafhankelijke bewijsplaats ook met handmatig toegevoegde metadata niet vullen. Ontbreekt de readback, dan blijft `OBLIGATIONS_COMPLETE` vereist, `success=false` en dus niet `LIVE_VERIFIED`.

Alle 328 originele bewijsrecords blijven append-only voor onafhankelijke historische beoordeling. Geen `UPDATE/DELETE`, nieuwe Supabase-migratie, RLS-wijziging, extra agent/worker/cron, providerverzending of zelfverklaarde klantwaarde. Deze wijziging **verifieert geen nieuwe material source**; pas een echte onafhankelijke oorspronkelijke productie-readback met bronreferentie en bronrevisie kan dat opleveren.

## Agents, regressie en release
De bestaande Reliability- en Data Quality-agenttaken en bestaande recovery-skill leggen de lezer- en historische-replayregel vast. Negatieve regressies testen oude zelfs volledig geaccepteerde self-proofs en onafhankelijke recordlabels zonder echte bronreferentie of revisie; positieve tests gebruiken een zelfstandig brongebonden readback. Native Required + CodeQL + origineel Netlify-producer/deploybewijs op exacte commit blijven verplicht.

Betrokken tests: `tests/brain-completion-supervisor.test.mjs`, `tests/completion-supervisor.test.mjs`, `tests/brain-completion-readiness.test.mjs`, `tests/brain-completion-supervisor-backfill.test.mjs`, `tests/brain-outcome-obligation-runtime.test.mjs` en afhankelijkheidsfixtures voor bestaande sociale publicatie, delivery-preflight en agentfabric. Oorspronkelijke P0 blijft open tot externe/consumentenuitkomst en Heartbeat-effect werkelijk zijn teruggelezen.
