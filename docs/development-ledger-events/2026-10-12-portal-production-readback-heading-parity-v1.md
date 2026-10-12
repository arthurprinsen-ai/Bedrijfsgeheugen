# 2026-10-12 — portal heading/production-readback regression
- Real source: GitHub job 114763173930, 13 passed, two failed after immutable deploy confirmed.
- Failures: full-parity and standalone tests expected retired all-pages menu copy. No evidence of native routing or source data failure.
- Repair: update those exact selectors to the new unique canonical dashboard H2, keep all protected route/legacy traffic checks.
- One test suite; no application changes or bypass of protected checks.
- Protected candidate to be merged and independently read back.
