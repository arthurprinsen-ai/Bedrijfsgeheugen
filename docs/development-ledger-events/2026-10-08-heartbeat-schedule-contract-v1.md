# Development ledger — Heartbeat scheduler source-runtime alignment

- Date: 2026-10-08
- Obligation-ID: powerhouse-heartbeat-schedule-contract-20261008-v1
- Previous source: `config/powerhouse-autonomous-improvement-runtime.json` minute42, `cycle_v1(now())`.
- Production authority: existing `cron.job` #52 at minute34, `powerhouse_autonomous_improvement_cron_v1()`, recent run history succeeded.
- Source provenance: `supabase/migrations/20261006085416_stagger_cron_database_pressure_v1.sql` intentional pressure staggering.
- Change scope: runtime contract + existing validator + existing regression + canonical Brain learning + change document + this event.
- No production mutation, extra Heartbeat, new cron, lowered checks or claim that scheduling alone proves self-improvement.
- Validation: `tests/brain-autonomous-improvement-runtime.test.mjs`; protected Required and CodeQL; runtime evidence after merge.
- Status: candidate until protected delivery and readback.
