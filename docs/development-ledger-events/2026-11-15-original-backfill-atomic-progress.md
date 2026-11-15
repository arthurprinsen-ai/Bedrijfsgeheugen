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

## Fresh original production source and protected-base reconciliation (2026-11-15)
- Independent ORIGINAL native backfill run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43706991852 completed SUCCESS on protected main `e32538c8493c5725e4b57378095db4ddbf676f6d`; GitHub job log reports **3716** source candidates, **8** canonical dispatches, **8** durable resume readbacks, **1** source obligation deferred as NOT_DUE, 0 skipped live-verified. Original uploaded immutable artifact ID `14157649993` (~347,817 bytes). This is resume dispatch proof, NOT eight independent provider/consumer outcomes.
- Earlier native backfill #43697572565 and #43699612359 ended cancelled with no terminal report; they are not green. Next original checkpoint must preserve the last independently validated partial resume before a failure, and never say COMPLETE with missing resumed dispatches.
- Protected existing PR #5846 reconciled on current main `069d76d2566d9d1d5b41ba7251af4b7a3c3fbb5c` using a no-force two-parent source merge of the exact 8 original files. **Current main's `applyOriginalBackfillDuePolicy`, valid `triggerType`, deferredNotDue and original `durable-supabase`/no-NOT_DUE gates were explicitly preserved.** Unrelated LinkedIn, SERP and provider changes were not copied from the stale PR branch.
- First CI run #43707925937 used stale GitHub event PR_BASE_SHA `e32538c...` despite the subsequently refreshed native PR base and classified 13 historical paths with old budget 7. This is a scope-parent mismatch, not verified app-level success. It must be corrected by a **fresh** exact-head original Required/CodeQL event on the updated PR base, and no branch hygiene limit may be bypassed.
- Original user-facing product and heartbeat outcomes still EVIDENCE_DUE. No new executor, scheduler, paid Supabase branch, queued parallel publish or bulk historical completion.
