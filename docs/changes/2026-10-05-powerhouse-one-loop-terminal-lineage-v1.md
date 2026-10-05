# Powerhouse one-loop terminal lineage v1

## Change

The commercial Powerhouse runtime is canonicalised into one auditable loop:

heartbeat → intelligence → decision → action → execution owner → terminal lifecycle → observed outcome → revenue/attribution → learning → next decision.

Legacy `powerhouse_commercial_closed_loop_v2` through `v6` remain callable only as compatibility aliases to the canonical v1 loop. They no longer own independent orchestration logic.

Exactly one full commercial scheduler owner remains: `powerhouse-one-commercial-loop-daily-v1`. Former split-stage commercial context/action scheduler owners are removed.

## Terminal lineage

Every terminal sales action now records explicit lifecycle lineage. This does **not** manufacture an observed commercial outcome.

- observed outcome evidence → `OBSERVED / CLOSED`
- internal, expired, skipped, failed or cancelled lifecycle → `NOT_APPLICABLE / CLOSED`
- externally executed action awaiting real response/revenue evidence → `PENDING_OBSERVATION / OPEN`

Historical repair is bounded with `FOR UPDATE SKIP LOCKED` so active production writers are not blocked.

## Regression prevention

The invariant is enforced in both Whole Brain Canonical Loop and the canonical Required test. Runtime readback also exposes scheduler ownership, legacy alias drift, unaccounted terminal actions and open observed-outcome obligations.

Production readback after migration:

- canonical scheduler owners: 1
- active split-stage owners: 0
- non-alias legacy loops: 0
- unaccounted terminal actions: 0
- open observed-outcome obligations: 10
- runtime regression gate: healthy

Open outcome obligations remain intentionally visible until real evidence arrives.
