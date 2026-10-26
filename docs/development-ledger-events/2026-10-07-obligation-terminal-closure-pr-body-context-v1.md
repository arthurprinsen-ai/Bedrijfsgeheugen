# 2026-10-07 — Terminal closure PR-body context recovery

Observed: Security Trust recovery PR #4063 merged successfully and Required + CodeQL were green, but legacy Obligation Terminal Closure run `37647792955` failed at identity with `OBLIGATION_ID_MISSING`.

Root cause: the canonical PR body was fetched and encoded in the context step but not forwarded as `PR_BODY_B64` into the identity step.

Action: bind the resolved body explicitly, add a regression, update continuity skill and System Map, and retain the existing fail-closed metadata parser.

No Security Trust runtime, provider, database or customer-data path is changed by this recovery.
