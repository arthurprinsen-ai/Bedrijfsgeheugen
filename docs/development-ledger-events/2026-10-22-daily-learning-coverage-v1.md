# 2026-10-22 — Outcome coverage false-green repair candidate

**Issue:** #4198. **Fingerprint:** `powerhouse|daily-compound-learning|outcome-coverage-denominator-mismatch|20261022-v1`.
**Observed:** live view 15.6057 despite mathematically bounded coverage requirement; 276/317 real terminal actions with outcomes.
**Root cause:** numerator 4,947 all-status linked actions, denominator 317 `done`; absent denominator treated as success.
**Scoped files:** view migration, regression tests, canonical Brain learning, change document, this append-only ledger entry.
**Prevention:** require same population, explicit no-observations state, [0,1] invariant, service-only access, CI shadow/canary, production readback.
**Writer outcome:** DRAFT candidate, NOT deployed, no scheduler or parallel error memory added.
