# Development ledger — database runtime mux P0 2026-10-20

Obligation-ID: database|existing-scheduler-start-spacing|20261020
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Commercial dependency: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

State: SOURCE_CANDIDATE — NO_PRODUCTION_DEPLOYMENT_CLAIM.
Evidence: live postgres logs at 2026-10-20T10:34Z include job 171 startup timeouts and SQL timeouts. Original job 171 schedule readback: three residues per five minutes; active=true. Historical pg_stat_statements cumulative spend reinforces workload diagnosis, not a causal performance benchmark.
Scope: existing pg_cron job 171 schedule guarded 36 -> 24 events per hour only, no command/job/active changes.
Acceptance: protected Required/CodeQL, preview dry run, post-merge migration and exact live readback, hourly error trend, scheduler task completion and commercial outcome SLA, rollback if backlog/latency degrades.
No synthetic sends/publications, no bypass, no duplicate executor, no assumed customer end-to-end green.
