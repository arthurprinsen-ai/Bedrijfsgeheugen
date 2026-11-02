# Append-only incident and test-contract recovery — 2026-11-02

- Parent issue #4439; fingerprint `powerhouse|brain|portal-two-measurement-stale-text-contract|20261102-v1`.
- Original provider evidence: GitHub Actions [41433667027](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41433667027), backend job 125238718390, on exact approved PR head `ace7e4b37b23517c8f3ad55fb4696d93f28bc562`; 5,400 total, 5,397 pass, 1 fail, 2 skip.
- Original protected main at failure `295c12ab94303af30b9b9fc30207d15ecf88db1e`, original portal Netlify READY deploy `6ae86dd8a73579a77a4c21eb`.
- Root cause: original assertion required obsolete one-run label, while new safe owner-only UI explicitly separates historical failed and later registered 0-failure software outcomes.
- Fix scope: only existing `tests/brain-portal-latest-original-backend-observation-20261102.test.mjs` plus original ONE BRAIN learning and human documentation. Test guards increase rather than decrease.
- Safety: no mocks substituted for authenticated readback, no RLS/auth/payment/provider/publication change, no suppressed failures, no parallel executor.
- State: CANDIDATE. Exact-head protected Required, CodeQL, full BRAIN, protected merge and fresh natural BRAIN acceptance required before marking solved. Historic failures retained and business 15-loop result independent.
