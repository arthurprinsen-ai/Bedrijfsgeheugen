# Accepted Instagram winner downstream lineage — 2026-09-20

## Incident
The daily Instagram winner was selected correctly and transitioned to `accepted`. The orchestrator later rejected that exact frozen winner because it reused the generic recommendation filter, which only accepted `suggested` or empty status.

## Root cause
Lifecycle semantics were inconsistent across selector and orchestrator. Selection made the winner authoritative, but downstream eligibility treated the resulting `accepted` state as invalid.

## Fix
For `instagram_company`, the required recommendation is valid only when:
- its ID exactly matches the persisted daily winner;
- `evidence.daily_winner=true`;
- its status is `suggested` or `accepted`.

All generic non-winner recommendation filtering remains unchanged and strict.

## Prevention
Never choose a second winner to recover from a downstream lifecycle mismatch. Reuse the same immutable winner and exact proven asset. Regression test: `tests/brain-instagram-accepted-winner-lineage.test.mjs`.

## Evidence
Winner: `50db782b-926f-4d3b-a2f4-2034b1767f3e`  
Observed recommendation status: `accepted`  
Observed orchestrator error: `select-pending:INSTAGRAM_DAILY_WINNER_LINEAGE_REQUIRED`  
Media job at discovery: `PROOF_VERIFIED`.
