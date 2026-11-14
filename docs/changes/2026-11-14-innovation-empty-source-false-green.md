# 2026-11-14 — zero candidate source is not a verified innovation cycle

## Reproduction
Original protected preview `bszjifiycurnerfmhvth` had **0** canonical candidates, **0** original producer obligations and **0** original agent intake operations. After provider applied migration `20261114193000`, a real preview call of `public.powerhouse_run_self_improvement_layer_v1(date)` returned `innovation_original_agent_intake.health=INDEPENDENTLY_VERIFIED`, despite `candidate_total=0` and `observed_cycles_verified=0`. This was a genuine empty-set false-green caused by no `v_intake_expected=0` first branch, not an actual innovation.

## Correct truth from original production
The same original function in canonical production `adhjwmvyoixzjtmiroln` (migration `20261114193000` applied as provider version 860, protected merged PR #5793) was independently run with **14** old candidates/obligations/intakes, 14 unclaimed, 14 older than 24h, zero independent effects. Existing `powerhouse_runtime_events` correctly read back `state=observed`, `data_quality=OWNER_HANDOFF_PENDING`, `health=RECOVERY_DUE`.

## Root cause and safe repair
The original code's `else 'INDEPENDENTLY_VERIFIED'` followed equal zero counts. New protected migration `20261114204500_innovation_zero_source_false_green_prevention_v1.sql` preserves all original producer+intake logic, one original daily scheduler, protected approval, RLS/permissions and evidence gate. It adds a leading `v_intake_expected=0` branch:
- health `NO_SOURCE_CANDIDATES`, **not** verified,
- original daily runtime event `observed`, with `data_quality=NO_SOURCE_CANDIDATES`,
- `zero_sources_never_green=true` as original-run evidence.

The empty source may be legitimate or may indicate upstream missing data; both are unverified rather than a proven business result. No new scheduler/queue/store/API grants or fake candidate data. Actual independent outcome proof remains `powerhouse_optimization_closure_truth_v1` with recorded owner, review and measured effect.

## CI and future proof
Regression appended to the **existing** `tests/brain-innovation-original-consumer-intake-20261114.test.mjs` which is already run by the **original** Daily Self Evolution workflow. Skill updated; original incident in canonical `brain_failure_registry` fingerprint `powerhouse|innovation|empty-source-false-green|20261114-v1`, 1 observation. Protected Required, CodeQL and Supabase preview must pass; independent new migration provider readback and preview zero-source run must return non-green before live claim. Original production with 14 remains RECOVERY_DUE until actual agent consumer ACK and independently observed value.
