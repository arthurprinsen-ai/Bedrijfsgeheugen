# CI observation coverage recovery

- Obligation: ci-observation-coverage-20261025
- Source: Janitor runtime 40226504139 telemetry `INSUFFICIENT_EVIDENCE`, 24 workflows sampled, 15 jobs
- Mechanism: bounded provider read expansion to 48 completed runs / 80 listed, maintaining all evidence minimums
- Safety: no threshold reduction, no CI bypass, no mutation/dispatch, provider errors fail closed
- Release proof pending exact-head Required, CodeQL, protected merge and subsequent Janitor artifact readback
