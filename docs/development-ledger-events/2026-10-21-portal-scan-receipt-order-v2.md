# 2026-10-21 — prevent older Frisse Blik receipt from taking precedence

- **Fingerprint:** `portal|scan-claim|cross-generation-most-recent-valid-receipt|20261021-v2`
- **Parent:** #4215; existing overlapping portal writer #4584 unchanged.
- **Reproduction:** V3 array in oldest-first order selects older scan; a valid newer V2 receipt loses to any valid older V3 item.
- **Cause:** short-circuit before evaluating all supported timestamped evidence.
- **Change:** latest valid timestamp across V3 and V2, preserve regex, seven-day retention and authenticated server claim boundary.
- **Tests:** `portal-v2/tests/scan-claim-receipt-order.test.mjs` (8 tests).
- **Provider:** no production claim, customer mutation or external connector call.
- **Landing dependency:** reconcile #4584 overlaps and refresh canonical System Map/explanation fingerprint. Required/BRAIN/CodeQL and exact-head production readback must be terminal success before LIVE_PROVEN.
- **Prevention:** new storage migrations must never prioritize storage version over verified receipt recency.
