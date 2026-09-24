# 2026-09-24 — Actions queue storm guard

- Fingerprint: `actions-queue-storm-guard-20260924-v1`
- Incident: 19 runs in progress en 121 queued
- Open PR's tijdens diagnose: 55
- Root cause: recovery-supervisor op main-push + 5-min schedule + multi-PR recovery fan-out
- Guard: geen main-push trigger, 15-min schedule, active-run circuit breaker = 20
- Recovery budget: maximaal 1 PR per supervisorcyclus
- Delivery PR: #2799
- Baseline CI repair included: company-ledger verified-value compatibility, because current main was already red on inherited ledger tests
