# Development ledger — Powerhouse Loop Assurance v2

- Date: 2026-09-29
- Change ID: `powerhouse-loop-assurance-v2`
- Repository: `arthurprinsen-ai/Bedrijfsgeheugen`
- Delivery: PR #3376
- Purpose: continuously prove that operational Powerhouse loops remain closed after the original fix/change.

## Material changes

Added a canonical runtime registry, stage receipts, derived assurance state, five-minute pg_cron refresh, Brain obligation handoff, repository registry, CI validator/test, agent contract and documentation.

## Production evidence

The migration was applied to Supabase project `adhjwmvyoixzjtmiroln`. The `powerhouse-loop-assurance-v2` cron is active every five minutes. The first readback returned AMBER rather than falsely green because the legacy loops had not yet emitted all eight explicit stage receipts. Matching `OPERATIONS_ASSURANCE` obligations were written to the canonical Brain obligation store.

## Guardrail

No loop may be presented as GREEN solely from absence of errors, a successful scheduler invocation or a one-time deployment. GREEN is derived from current scheduler/runtime evidence and complete stage evidence.
