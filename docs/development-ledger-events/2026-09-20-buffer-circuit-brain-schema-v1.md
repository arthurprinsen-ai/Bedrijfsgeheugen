# Development ledger — buffer-rate-limit-circuit-brain-schema-v1

Date: 2026-09-20
Obligation: `buffer-rate-limit-circuit-brain-schema-v1`
Lane: backend
Failure class: `SCHEMA_CONTRACT_MISMATCH`

Observed live constraint: brain_records permits CurrentState/current_state but not RuntimeState/runtime_state.

Change: publisher circuit writeback aligned to the canonical Brain schema; regression extended to prevent recurrence.

Evidence:
- `supabase/functions/powerhouse-social-publisher/index.ts`
- `tests/brain-buffer-rate-limit-circuit-v1.test.mjs`
- `brain/learning/2026-09-20-buffer-circuit-brain-schema-v1.json`
