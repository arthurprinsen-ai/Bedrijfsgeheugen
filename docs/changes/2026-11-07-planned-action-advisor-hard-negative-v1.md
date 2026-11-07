# Planned-action advisor trigger: pinned hard negatives and recall fix — 2026-11-07

## Problem
Wave 4 (#5508) shipped `DO_NOT_AUTO_FIX_PERFORMANCE_INFO` with a trigger that a first version made too loose (the bare word "advisor" fired on "strategic advisor" in #5212). That was caught by a one-off replay of 400 commit titles which is not part of CI, so the fix was a REGEL, not enforced. Writing the regression test then exposed a second, opposite defect: the trigger missed "Drop the unused index reported by the Supabase advisor", because the action words only had "drop index".

## Change
- `tests/brain-planned-action-advisor-hard-negative-20261107.test.mjs`: three real commit titles containing "advisor" must not fire the rule; three genuine Supabase advisor actions must fire it; a mutation check proves the test fails against the original bare-word trigger.
- `config/planned-action-triggers.json`: action words of this one rule widened from `drop index` to `drop`, `add an index`, `adding an index`, `add index`, `resolve` (system terms unchanged and specific, so precision is kept).

## Evidence (local)
Advisor test 3 of 3 green; 22 of 22 related planned-action tests green; 0 hits for this rule in 400 recent commit titles.

## Known limit
Still hand-picked examples. Recall across all 19 wave4 rules stays NOT_MEASURED and belongs to #5510.
