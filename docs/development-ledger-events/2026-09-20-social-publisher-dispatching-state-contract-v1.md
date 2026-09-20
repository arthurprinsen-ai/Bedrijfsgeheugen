# Development ledger — social-publisher-dispatching-state-contract-v1

Date: 2026-09-20  
Obligation: `social-publisher-dispatching-state-contract-v1`  
Lane: backend  
Failure class: `STATE_MACHINE_SCHEMA_DRIFT`

## Observed

Production pre-publish review passed, but the publisher failed before capability issuance. A controlled transaction reproduced SQLSTATE `23514` on `powerhouse_channel_decisions_state_chk` when attempting `content_ready -> dispatching`.

## Root cause

Runtime and schema state machines drifted: runtime used `dispatching`, schema did not permit it.

## Change

Add `dispatching` to the canonical state constraint while preserving the atomic single-writer claim and all publication gates.

## Evidence

- `supabase/functions/powerhouse-social-publisher/index.ts`
- `supabase/migrations/20260920102000_social_publisher_dispatching_state_contract.sql`
- `tests/brain-social-publisher-dispatching-state-contract.test.mjs`
- `brain/learning/2026-09-20-social-publisher-dispatching-state-contract-v1.json`
