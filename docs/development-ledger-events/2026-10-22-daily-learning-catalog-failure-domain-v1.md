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
