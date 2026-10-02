# 2026-10-02 — CMS test CI wiring recovery

- Failure: committed CMS contract test was not executed by any workflow.
- Recovery: wire `tests/cms-website-portal-v1.test.mjs` into the canonical Required test full shared suite.
- Evidence: Required test run 37032367527.
- Terminal: merge only after the canonical required gate proves the test is exercised.
