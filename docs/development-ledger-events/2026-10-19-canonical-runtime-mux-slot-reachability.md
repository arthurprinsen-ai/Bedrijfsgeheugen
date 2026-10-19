# Development ledger — 2026-10-19 — Canonical runtime mux slot reachability

- Obligation-ID: `canonical-mux-cron-reachability-20261019`
- Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4478
- Source evidence: live `cron.job` job 171 only triggered residue 1 in modulo-5 minutes; runtime function predicates at residues 3/4 were mathematically unreachable.
- Before change: production audit had to be executed manually on 19 October; 7,041 forecasts, 385 due, 247 unresolved. This is observation, not backfilled improvement.
- Root cause: clock-slot contract drift between the single authorized scheduler and its v1/v2 task predicates, not a missing worker or tenant grant.
- Material change: in-place `cron.alter_job` for the one canonical job, plus baseline watchdog/reconciliation gating to the original slots only. No additional cron, secret, synthetic source signal, or bypass.
- Regression: `tests/brain-runtime-scheduler-reachability-20261019.test.mjs`, with mandatory historical-replay evaluation in the learning contract.
- Remaining release condition: Required CI + CodeQL, protected merge, production SQL migration, actual scheduled slot-3 and slot-4 evidence, then next daily audit at 06:04 UTC. Unknown until observed.
- External Tavily HTTP 432, financial customer evidence gaps, and revenue intelligence SQL timeouts remain distinct incidents.
