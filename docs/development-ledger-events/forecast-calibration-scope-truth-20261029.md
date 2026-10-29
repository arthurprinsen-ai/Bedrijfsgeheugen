# 2026-10-29 calibration scope-truth investigation (public-safe)

- Observed 32/32 ONE BRAIN layers wired, 18/18 required cron jobs active; overall architecture AMBER due to 2 current runtime errors and content BLOCKED.
- Existing calibrator cron #30 is active hourly at minute 50; last 24h recorded 24 scheduler invocations marked succeeded.
- Public calibrator production Edge v503 responded to its queue with `NO_DUE_CALIBRATIONS`. Underlying `powerhouse_public_market_calibration_due_v1` returns only public scopes, never person/company. Read-only evidence counts 1,753 overdue canonical obligations, comprising 1,483 person and 270 company; public scope due 0.
- Causal gap: reporting scope-limited zero as an unqualified global zero hid private calibration debt. No evidence that queue operation failed or that private outcomes can be safely marked closed.
- Candidate remediation: bounded count-only Heartbeat + response state, source regression, Brain learning, existing skill inheritance. Original private data stays in Supabase; no new provider/external egress or scheduling.
- Terminal proof is still pending: protected Required/BRAIN/CodeQL, exact GitHub main, authorized native Supabase Edge deploy, file parity and authenticated production canary.
