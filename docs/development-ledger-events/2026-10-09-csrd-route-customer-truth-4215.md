# Development ledger — CSRD route and customer truth

- Parent: P0 #4215; obligation: `portal-csrd-route-live-unknown-20261009-v1`.
- Base main: `ed3833203ccf973b0e39fc20b85dedff36507b2a` (merged PR #4224).
- Changed: `portal-v2/csrd-impact.js`, `portal-v2/page-shell.js`, `portal-v2/tests/csrd-impact.test.mjs`, `tests/integration/portal-v2-production-csrd.spec.js`.
- Contract: deterministic navigation/readback; real customer with missing data sees unknown; demo remains explicitly labelled. No authorization bypass.
- Proof requested: native CSRD unit tests, portal CI, browser against exact release, then separate authenticated tenant readback and authoritative regulatory CSRD source review.
- Current evidence: candidate code only; merge, production and authorized tenant outcomes must be checked independently.
