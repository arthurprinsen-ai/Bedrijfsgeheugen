# Append-only development ledger — 2026-10-22 — autonomous daily learning starvation

Fingerprint: `learning|daily-self-evolution|catalog-freshness-failfast|20261022-v1`  
Obligation-ID: `powerhouse|daily-self-evolution|independent-failure-domain-recovery|20261022-v1`  
Parent existing incident: [#4367](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4367) (source freshness).  
State: CANDIDATE pending exact CI, protected merge and runtime readback.

## Evidence and diagnosis
- Failed original daily runs: [2026-10-21 #39578449326](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39578449326) and [2026-10-22 #39756866887](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39756866887).
- The current AI model audit returned `REFRESH_REQUIRED`; the same-job exit code 1 then skipped canonical daily evolution snapshot, continuous improvement, capability inventory, engineering self-tests and artifact upload.
- Distinct root causes: supplier catalog freshness needs true source revalidation (existing #4367) while the daily learning orchestration had cross-domain fail-fast coupling (this change).
- Forbidden attempts: blind retrigger without fixing coupling, catalog verified_at mass restamp, waiver of failing supplier checks, new parallel scheduler or learner.

## Source correction and regression
- Existing `.github/workflows/powerhouse-daily-self-evolution.yml`: parallel independent `improve` and `model-freshness` jobs under one original daily schedule. No `needs` dependency. Strict catalog audit remains red when unverified and uploads evidence via `if: always()`.
- `tests/powerhouse-daily-self-evolution.test.mjs`: independence, exact unchanged audit script, unchanged daily learning scripts, no swallowed error, artifact survival, no second scheduler.
- Brain learning: `brain/learning/2026-10-22-daily-learning-provider-freshness-isolation-v1.json`.
- Shared skill and System Map updated in this same candidate. Exact checks and post-merge run results must be added before declaring closure.

## Outcome policy
`improve=success` with `model-freshness=failure` means **daily learning execution has recovered but supplier catalog is still unverified**. The workflow must remain RED and the provider incident remains open; do not hide failures to manufacture a green dashboard.


## Candidate incident during protected learning admission (same lineage)

Initial PR #4666 head `8013e767138983e5c71d240da0511d322ec55263` failed `hygiene / admission` in GitHub run [#39812960951](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39812960951) for exactly `LEARNING_EVALUATION_TEST_PATH_INVALID:historical_replay:tests/powerhouse-daily-self-evolution.test.mjs`. The test existed, but the canonical Brain evaluator allows only executable `tests/brain-*.test.mjs` paths. No quality gate was bypassed. Corrected under the same PR by adding `tests/brain-daily-learning-failure-isolation-v1.test.mjs` with meaningful historical/shadow/canary assertions and referring to that path in learning. Protected admission was independently observed `completed/success` on the corrected candidate before subsequent protected main synchronization.

Prevent recurrence: preflight the actual learning-canonicalization path contract **before** the first PR; avoid adding duplicate fake placeholder tests or weakening the validator. This is an occurrence under the original repair lineage, not a second incident owner. The daily provider freshness issue #4367 is separately still OPEN.


## Duurzame uitvoeringscheckpoint bij nieuwe fouten
De al bestaande `improve`-job legt voortaan via `if: always()` zijn `run_id`, `run_attempt`, exacte `head_sha`, `job_status`, eigenaar en `next_safe_action` vast in `artifacts/quality/daily-learning-execution-checkpoint.json`. Het bestaande artifact-uploadpad draait óók wanneer een stap faalt. `terminal_proof=false` voorkomt schijnbewijs dat een checkpoint gelijkstaat aan een geslaagd leerresultaat. Dit is geen extra scheduler of waarheidssysteem; het is bewijsmateriaal waarmee dezelfde eigenaar na een onderbreking of incident causaal kan hervatten.
