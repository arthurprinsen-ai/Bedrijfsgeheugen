# 2026-11-14 — zero candidate source is not a verified innovation cycle

## Reproduction
Original protected preview `bszjifiycurnerfmhvth` had **0** canonical candidates, **0** original producer obligations and **0** original agent intake operations. After provider applied migration `20261114193000`, a real preview call of `public.powerhouse_run_self_improvement_layer_v1(date)` returned `innovation_original_agent_intake.health=INDEPENDENTLY_VERIFIED`, despite `candidate_total=0` and `observed_cycles_verified=0`. This was a genuine empty-set false-green caused by no `v_intake_expected=0` first branch, not an actual innovation.

## Correct truth from original production
The same original function in canonical production `adhjwmvyoixzjtmiroln` (migration `20261114193000` applied as provider version 860, protected merged PR #5793) was independently run with **14** old candidates/obligations/intakes, 14 unclaimed, 14 older than 24h, zero independent effects. Existing `powerhouse_runtime_events` correctly read back `state=observed`, `data_quality=OWNER_HANDOFF_PENDING`, `health=RECOVERY_DUE`.

## Root cause and safe repair
The original code's `else 'INDEPENDENTLY_VERIFIED'` followed equal zero counts. New protected migration `20261114213500_innovation_original_agent_intake_recovery_v1.sql` preserves all original producer+intake logic, one original daily scheduler, protected approval, RLS/permissions and evidence gate. It adds a leading `v_intake_expected=0` branch:
- health `NO_SOURCE_CANDIDATES`, **not** verified,
- original daily runtime event `observed`, with `data_quality=NO_SOURCE_CANDIDATES`,
- `zero_sources_never_green=true` as original-run evidence.

The empty source may be legitimate or may indicate upstream missing data; both are unverified rather than a proven business result. No new scheduler/queue/store/API grants or fake candidate data. Actual independent outcome proof remains `powerhouse_optimization_closure_truth_v1` with recorded owner, review and measured effect.

## CI and future proof
Regression appended to the **existing** `tests/brain-innovation-original-consumer-intake-20261114.test.mjs` which is already run by the **original** Daily Self Evolution workflow. Skill updated; original incident in canonical `brain_failure_registry` fingerprint `powerhouse|innovation|empty-source-false-green|20261114-v1`, 1 observation. Protected Required, CodeQL and Supabase preview must pass; independent new migration provider readback and preview zero-source run must return non-green before live claim. Original production with 14 remains RECOVERY_DUE until actual agent consumer ACK and independently observed value.

## Newly observed original ONE BRAIN interruption — no worker started

At 2026-11-14 18:29:45 UTC all 14 canonical agent intake operations were created through original `brain_create_operation`, bound to original registered engineering/CRO agents. The original five-minute execution-resilience watchdog then marked **all 14** `RESULT_UNKNOWN / WORKER_LOST` around 18:36 UTC despite `side_effect_state=NOT_STARTED`, `remote_ref=NULL` and no consumer action. This generated 14 original `EXECUTION_RESILIENCE_RECOVERY` jobs; original recovery worker returned `NO_SAFE_CANONICAL_RECOVERY_HANDLER` and the jobs stayed pending. Simply replaying or asserting green would falsify consumer acceptance.

The *same* protected PR now adds a separate forward-only migration `20261114213500_innovation_original_agent_intake_recovery_v1.sql` to extend ONLY the original watchdog's two selectors and original reconciliation worker: never interpret never-started `PLANNED INNOVATION_INTAKE` as lost worker, and recover previously misclassified operations only with source revision, Brain control-plane binding, no remote reference and `NOT_STARTED` readback. Recover to `PLANNED` **without executing** external side effects or marking `VERIFIED`; original `brain_obligations` remain OPEN and daily overdue Healthbeat remains RECOVERY_DUE. Other operation types keep the original fail-closed recovery behavior. No new cron, worker or storage. True owner consumption still needs exact independent receipt and outcome proof.

## ESCALATED jobs: source-bound bounded original recovery

A later independent provider query found **14 original** innovation `brain_reconciliation_jobs` already `ESCALATED` after three fail-closed no-progress attempts, not still pending. The existing worker cannot claim `ESCALATED`. The same original mux-owned watchdog now schedules **one** new idempotent original `EXECUTION_RESILIENCE_RECOVERY` job per exact candidate+operation revision only with existing candidate, obligation, identical payload SHA/correlation, original registered-agent binding, verified prior `ESCALATED`, `NOT_STARTED`, `WORKER_LOST` and no `remote_ref`. It does not create a new queue or worker; it refuses unlimited retries. The existing original worker uses the new PENDING job to recover `RESULT_UNKNOWN` back to `PLANNED` with evidence `NO_SIDE_EFFECT_STARTED`, not to terminalize or dispatch. Original watchdog stage guard explicitly fails while any never-started intake remains `RESULT_UNKNOWN`. Historical regression, ONE BRAIN learning and the original P0 #4198 now include this escalation proof. Atomic protected migration: `20261114213500_innovation_original_agent_intake_recovery_v1.sql`.

## Werkelijke runtime-eigenaar v2 (2026-11-14)

De oorspronkelijke vijf-minuten-mux `powerhouse_runtime_scheduler_mux_v1`, aangeroepen via v2/v3, gebruikt aantoonbaar `powerhouse_reconciliation_worker_v2`, **niet** v1. Dat is bevestigd uit de productie-functiedefinitie en de `brain_reconciliation_jobs.evidence.worker=powerhouse-reconciliation-worker-v2` van de 14 echt geëscaleerde jobs. De beschermde migratie vervangt daarom de bestaande **v2**-functie, met behoud van de gewone `safe_replay=true`- en fail-closed-paden. Alleen een brongebonden, idempotente hersteljob na de oorspronkelijke escalatie (`prior_escalation_verified=true`, exacte operation_id, eigenaar, kandidaatbron, oorspronkelijke verplichting en control-plane binding, geen remote_ref, side-effect `NOT_STARTED`) mag zonder externe actie terug naar `PLANNED`. Dit blijft **zonder consumer ACK**, gevalideerde waarde of automatische publicatie. Test en skills controleren expliciet v2 om een papieren correctie in de verkeerde functie voortaan te blokkeren.
