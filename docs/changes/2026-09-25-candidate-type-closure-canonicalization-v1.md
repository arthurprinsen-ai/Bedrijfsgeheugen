# Candidate-Type closure canonicalization

**Date:** 2026-09-25  
**Fingerprint:** `delivery|candidate-type-docs-closure-canonicalization|v1`

A repeated avoidable delivery failure was identified: a documentation/borging candidate used `Candidate-Type: closure`, while the canonical delivery contract accepts only `implementation`, `recovery`, `security`, `dependency`, `docs` and `promotion`.

Permanent rule:
- docs/borging/learning/ledger-only work uses `Delivery-Lane: docs` + `Candidate-Type: docs`;
- legacy `closure` is canonicalized to `docs` before admission only when the lane is `docs`;
- `closure` in every other lane remains invalid and fail-closed;
- metadata recovery stays on the same PR/obligation lineage; no bypass and no replacement PR merely to escape the gate.

Regression: `tests/delivery-hygiene-policy.test.mjs`.
