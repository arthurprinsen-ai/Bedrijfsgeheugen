# External signal to customer decision — 2026-10-25

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Obligation: portal:external-signals-customer-next-action:20261025-v1
- Failure: general signal cards lacked an explicit company relevance reason and next step; a displayed action button lacked its navigation listener
- Repair: retain current authenticated portal and existing daily source schedule; show tenant score, provenance, source-date qualification and next safe step
- Negative checks: stale or expired claims and unverified source URLs never become executable customer actions
- Regression: tests/brain-portal-external-source-action-20261025.test.mjs
- Verification: Required, CodeQL, protected merge, Netlify production revision and authenticated readback required
- State: candidate, not yet independently verified live
