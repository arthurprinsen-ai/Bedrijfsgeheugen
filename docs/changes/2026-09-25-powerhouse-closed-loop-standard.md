# Powerhouse Closed-Loop Standard — canonical change record

**Canonical since:** 2026-09-25  
**Fingerprint:** `powerhouse-closed-loop-evidence-first-v1`

Powerhouse uses one evidence-first closed loop across sales, content, social, growth and autonomous improvement.

## Canonical lifecycle

`signal → analysis → prediction → decision → execution → provider_readback → outcome → realized_value → calibration → next_decision`

A cycle is complete only at `next_decision`, after the preceding evidence-backed stages exist.

## Runtime implementation

Production database migrations:
- `close_powerhouse_decision_loops_v2`
- `close_powerhouse_channel_loops_v1`
- `canonical_social_provider_observations_v1`

The runtime is fail-closed. Historical or future records without observed external outcome/value evidence remain open, blocked or outcome_pending. They are never auto-promoted merely to obtain a green status.

Sales outcomes automatically write canonical outcome lineage and realized-value evidence. Channel decisions use the same stage machine; social measurement only closes when observed measurement evidence exists.

## Provider governance

LinkedIn direct publication authority is Composio. Buffer is legacy transport/metrics and is not accepted as direct publication truth. Instagram direct evidence must come from the governed provider path. Provider observations are persisted in `powerhouse_evidence_source_observations`.

## Operating rule

All agents, chats and autonomous workers must treat closed-loop evidence as the terminal delivery contract. Merge/deploy/publication is an intermediate state. Terminal delivery means production readback plus applicable outcome, realized value, calibration and next-decision writeback.

## Verification

Operational health is read from `powerhouse_closed_loop_health_v1`. A completed cycle must show all ten canonical stages in contiguous sequence. Missing external evidence is surfaced, not inferred.
