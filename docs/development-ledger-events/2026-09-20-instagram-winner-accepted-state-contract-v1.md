# Development ledger — instagram-winner-accepted-state-contract-v1

Date: 2026-09-20  
Obligation: `instagram-winner-accepted-state-contract-v1`  
Lane: backend  
Failure class: `CONTENT_ORCHESTRATOR_FROZEN_WINNER_STATE_CONTRACT_DRIFT`

## Observed

Production repeatedly logged `select-pending:INSTAGRAM_DAILY_WINNER_LINEAGE_REQUIRED` after the Instagram daily winner had already been selected and frozen.

## Root cause

The winner-selection contract changes the selected recommendation to `accepted`. The downstream orchestrator still treated only `suggested` or empty recommendation status as eligible. The immutable winner was therefore rejected by the next stage of the same pipeline.

## Change

The orchestrator now treats `accepted` as eligible for downstream reuse while preserving the same frozen recommendation identity. No Mira, media, publication-authority or provider-safety gate is weakened.

## Prevention

The canonical regression in `tests/brain-instagram-mira-winner-selection-v1.test.mjs` asserts that an accepted frozen winner remains eligible downstream.

## Evidence lineage

- Runtime: `supabase/functions/powerhouse-content-orchestrator/index.ts`
- Regression: `tests/brain-instagram-mira-winner-selection-v1.test.mjs`
- Brain learning: `brain/learning/2026-09-20-instagram-winner-accepted-state-contract-v1.json`
- Human documentation: `docs/changes/2026-09-20-instagram-winner-accepted-state-contract-v1.md`
- Terminal proof required: protected merge → exact-main Supabase deploy → source readback → closed-loop run without `INSTAGRAM_DAILY_WINNER_LINEAGE_REQUIRED`.
