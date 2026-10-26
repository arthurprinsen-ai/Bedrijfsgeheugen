# Main drift + cancelled Required recovery — 2026-10-06

## Problem

A terminal candidate could fall behind protected main while its previous Required attempt became `cancelled`. The recovery classifier handled `cancelled` as a generic failed gate before it considered `behindBy > 0`. That left branch protection showing required checks as expected even though the correct action was a same-lineage main refresh.

## Structural correction

- `cancelled Required + behind main + no active newer Required` now maps to `MAIN_DRIFT_RECOVERY`;
- a genuine Required `failure` still maps to `FAILED_GATE_RECOVERY`;
- the existing supervisor remains the only mutator and still requires an exact terminal writer lease, same-repository branch, merge base and zero path overlap;
- no successor PR is created for non-overlapping main drift;
- after same-lineage refresh, the new candidate HEAD naturally enters the canonical Required path.

This closes the recurring `main drift -> cancelled Required -> checks expected` dead end without weakening branch protection or retrying failed tests blindly.
