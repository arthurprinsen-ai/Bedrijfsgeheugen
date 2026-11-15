# 2026-11-15 | ONE BRAIN observatie ≠ terminale taakafronding

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|one-brain|observation-completed-while-supervisor-unverified|20261115-v1`
- Oorspronkelijke codeoorzaak: `tools/outcome-obligation-runtime.mjs` retourneerde `decision.status=COMPLETED` na eenvoudig onafhankelijk observatiebewijs, ook als `supervision.success=false` door ontbreken van onafhankelijke exact source-bound `OBLIGATIONS_COMPLETE` en overige terminale bewijzen.
- Wijziging: op **dezelfde** bestaande runtime-return wordt onterecht `COMPLETED` omgezet naar `AWAITING_OUTCOME`, met expliciete `terminalEvidenceDue=true`. Oorspronkelijke `SUPERVISOR_DECISION`, idempotency keys en werk-eigenaar blijven.
- Oorspronkelijke bronnen: `brain_outcome_obligation_dispatch` en `brain_outcome_obligation_evidence`, Supabase `adhjwmvyoixzjtmiroln` read-only audit 2026-11-15; 4.958 AgentWork/PENDING en 1.059 RecoveryWork/RECOVERING voordat herstel. Het zijn historische append-only rijen, geen aangenomen mislukte externe provideracties.
- Negatieve regressie: `tests/brain-outcome-obligation-runtime.test.mjs` weigert terminale claim op één `independent` of generieke `exactProduction`-observatie. Positief: alleen complete vertrouwde evidence en oorspronkelijke supervisor mogen afsluiten.
- Eigenaar: bestaande Reliability-agent en onafhankelijke Data Quality-agent; originele Completion Supervisor Backfill Resume. Geen tweede scheduler, extra agent of providerwrite.
- Releasestatus: SOURCE_CANDIDATE. Werkelijke vrijgave pas na protected CI, main, natuurlijke originele run en provider-readback. Geen bulkcorrectie en geen volledig groen zolang onafhankelijke afwikkeling ontbreekt.
