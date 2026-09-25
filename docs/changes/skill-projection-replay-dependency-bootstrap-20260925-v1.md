# Skill projection replay dependency bootstrap — 25 September 2026

Fingerprint: `skill-projection-replay-dependency-bootstrap-20260925-v1`

## Incident
Powerhouse Skill Projection failed during learning canonicalization with `ERR_MODULE_NOT_FOUND: parse5`. The replay had not reached its assertion: the clean runner had no repository dependencies installed.

## Root cause
The workflow executed `learning-canonicalization-gate.mjs` immediately after Node setup. Historical replay is allowed to execute classified Brain regressions that import normal repository modules and package dependencies.

## Fix
The workflow now installs repository dependencies before canonicalization replay. Replay remains fail-closed; no learning or regression evidence is weakened.

The i18n fail-closed regression was also corrected to validate semantic ordering rather than requiring the error throw to be immediately adjacent to `if (cacheRequired)`; runtime logging between the guard and throw is valid.

## Prevention
- bootstrap dependencies before replay;
- distinguish environment/bootstrap failure from learning assertion failure;
- keep executable ordering regression in the Brain backend suite;
- preserve exact-head protected delivery.
