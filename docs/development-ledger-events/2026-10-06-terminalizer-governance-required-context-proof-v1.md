# 2026-10-06 — Protected context uniqueness / terminalizer governance

Obligation: `terminalizer-governance-required-context-proof-20261006-v1`

Observed:
- main branch reports `protected=true`;
- required status contexts exposed by GitHub are `test` and `CodeQL javascript-typescript`;
- PR #3908 auto-merged before its Required-test aggregator completed;
- the same SHA had an earlier successful generic `test` check from another workflow, creating context aliasing;
- Required-test run `37466094024` later failed on the stale aggregator-wiring regression;
- terminalizer run `37466516972` failed because authority control-plane files were classified as unknown runtime.

Current-main state already repaired in parallel:
- non-Required workflows no longer own the generic `test` context;
- `tests/brain-required-status-context-uniqueness-v1.test.mjs` prevents recurrence;
- `tests/delivery-hygiene-required-wiring.test.mjs` includes `supabase_preview` in the aggregator dependency set.

This candidate closes the remaining gaps:
- terminalizer governance classification for Supabase Edge authority files;
- live protected-context names in Main Protection Observation;
- regression coverage for both.

No runtime/provider mutation is part of this candidate.
