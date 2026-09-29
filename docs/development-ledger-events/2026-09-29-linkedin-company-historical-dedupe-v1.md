# Development ledger — LinkedIn company historical dedupe v1

- Date: 2026-09-29
- Obligation: linkedin-company-historical-dedupe-v1
- Lane: backend
- Root cause: company publications did not receive the durable story fingerprint used by personal LinkedIn; date-varying measured links could weaken similarity-only detection.
- Runtime change: story fingerprint + canonical duplicate body now apply to linkedin_company before the provider call.
- Regression: tests/brain-linkedin-company-historical-dedupe-v1.test.mjs
- Invariant: one canonical daily claim, no second provider write for exact/near-duplicate historical company content.
