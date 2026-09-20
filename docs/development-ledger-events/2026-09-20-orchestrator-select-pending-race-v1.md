# Development ledger — orchestrator-select-pending-race-v1

Date: 2026-09-20  
Obligation: `orchestrator-select-pending-race-v1`  
Lane: backend  
Failure class: `CONTENT_ORCHESTRATOR_PENDING_SELECTION_RUNTIME_FAILURE`

## Observed
Production content-loop response showed `powerhouse-content-orchestrator` HTTP 500 with stage `select-pending`.

## Root cause
The pending publication queue head was read through `.limit(1).maybeSingle()`, coupling orchestration to a fragile PostgREST single-object conversion.

## Change
Replaced single-object conversion with deterministic array-head selection and explicit error diagnostics.

## Prevention
Canonical replay: `tests/brain-powerhouse-content-orchestrator-pending-selection.test.mjs`.

## Evidence lineage
- Brain learning: `brain/learning/2026-09-20-orchestrator-select-pending-race-v1.json`
- Runtime: `supabase/functions/powerhouse-content-orchestrator/index.ts`
- Human documentation: `docs/changes/2026-09-20-orchestrator-select-pending-race-v1.md`
- Expected terminal proof: protected merge → exact-main Supabase deployment → source equality → closed-loop retry without select-pending failure.
