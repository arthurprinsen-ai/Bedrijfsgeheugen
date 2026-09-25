# Powerhouse Closed-Loop Delivery Standard

## Status
Canonical Powerhouse skill. Mandatory for autonomous sales, content, social, growth, portal intelligence and improvement loops.

## Invariant
A Powerhouse decision is not complete at recommendation, code, dispatch, publication, merge, deploy or provider acceptance. Completion requires evidence through the canonical chain:

`signal → analysis → prediction → decision → execution → provider_readback → outcome → realized_value → calibration → next_decision`.

Stages advance monotonically and exactly one canonical stage at a time. Never skip stages to manufacture closure.

## Truth gates
- Every stage requires an evidence reference.
- Provider acceptance is not an outcome.
- Publication is not business value.
- Predicted/expected value is never stored as realized value.
- Realized value requires observed evidence.
- Missing evidence remains open, blocked or outcome_pending; never fabricate a green state.
- Replays must be idempotent. The same provider event/outcome may not create duplicate closure.
- Learning may influence future policy only after outcome and calibration evidence exist.

## Canonical runtime
Machine truth is in Supabase. GitHub contains the reproducible contract and documentation. Human projections (portal/Notion) are projections, not truth authorities.

Core objects:
- `powerhouse_decision_cycles`
- `powerhouse_cycle_events`
- `powerhouse_realized_values`
- `powerhouse_closed_loop_health_v1`
- `powerhouse_sales_actions` / `powerhouse_sales_outcomes`
- `powerhouse_channel_decisions`
- `powerhouse_evidence_sources`
- `powerhouse_evidence_source_observations`

## Social provider authority
Direct LinkedIn publication/readback uses Composio as governed publication evidence. Buffer is legacy transport/metric readback only and must not satisfy direct-publication truth gates. Instagram provider evidence must be observed from the governed direct provider path; Mira-only media rules remain mandatory.

## Delivery rule
For every relevant change: inspect current state → change → verify → deploy/activate → production readback → outcome/value measurement → calibration → prevention/learning writeback. Do not report LIVE/DONE before the applicable evidence exists.

## Health
Use `powerhouse_closed_loop_health_v1` to expose complete, open, blocked, outcome_pending and calibration_pending cycles. Historical cycles without real external outcomes remain explicitly non-complete.

## Prevention fingerprint
`powerhouse-closed-loop-evidence-first-v1`
