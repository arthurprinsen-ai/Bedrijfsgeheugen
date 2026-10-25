# Portal relevance action closure

- Date: 2026-10-25
- Root cause: public market signals, company impact and actions were displayed independently.
- Fix: same-card reason, source, next step, verified task link, stale-source and past-deadline suppression.
- Regression: tests/brain-portal-external-next-action-v1.test.mjs
- Gate: Required, CodeQL, protected merge, live Netlify and authenticated tenant proof.
- Status: CANDIDATE, not yet live verified.
