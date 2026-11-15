# ONE BRAIN — append-only ontwikkeloverdracht: onderbroken backfill
Datum: 2026-11-15

- Bestaand incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Root cause: oorspronkelijke backfill schrijft eindrapport pas na alle resume-calls; geannuleerde runs #43697572565 en #43699612359 missen terminale artifact.
- Reeds gemergde beschermde bronnen: #5835 canonical coalescing, #5837 mixed-hard-boundary veto. Geen wijzigingen aan hun oorspronkelijke eigenaar, tenant of idempotency.
- Maatregel: originele `tools/outcome-obligation-completion-supervisor-backfill.mjs` checkpoint vóór en ná elke canonieke resume, atomair via rename; originele workflow `if: always()`-artifact; zelfde Reliability/Completion Supervisor eigenaar.
- Preventie: `COMPLETE` alleen als alle verwachte, unieke oorspronkelijke obligationIds met identieke coalesceKey een resume-resultaat teruggeven. Daarmee nooit onafhankelijke agent/provider-effecten bewezen verklaren.
- Regressie: `tests/brain-completion-supervisor-backfill.test.mjs`; Required/CodeQL en exact protected merge nog verschuldigd op dit wijzigingsmoment.
- Open ontvangstbewijs: eerstvolgende natuurlijke originele GitHub workflow schrijft een geldig source-count, expected/resumed checkpoint en artifact; bij cancellation expliciet `EVIDENCE_DUE`. Vervolgens echte oorspronkelijke owner-consumer `PROCESSED`, provider/Heartbeat, effect en leren afzonderlijk aantonen.
- Veiligheid: geen nieuwe scheduler, queue, credentials, gefabriceerde providerresponses of bulkclosure van immutable dispatchhistory.
