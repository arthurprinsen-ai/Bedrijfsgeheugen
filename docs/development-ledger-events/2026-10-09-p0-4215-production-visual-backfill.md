# P0 #4215 development event — historical approved PR visual replay

- Date: 2026-10-09
- Obligation: `p0-4215-production-visual-manual-replay-20261009-v1`
- Incident: previous production visual baseline resolver required an exact-head successful auxiliary preview run that could be skipped/canceled; current Netlify status sometimes uses a `deploy-preview-N--bedrijfsgeheugen.netlify.app` URL rather than the dashboard URL.
- Existing system only: protected GitHub PR source, default production DOM readback workflow, existing provider allowlist helper, immutable Netlify deploy, Playwright visual regression suite.
- Repair: explicit PR source via manual production verification, merged PR ancestry check, strict numbered preview alias, immutable SHA/deploy pin, unchanged pixel diff policy, failure-preserving verification.
- Regression: `node --test tests/brain-p0-4215-production-visual-backfill-v1.test.mjs`.
- Release: Required and CodeQL protected, exact-main Netlify, manual production readback and immutable evidence receipt.
- Other P0 gates: two genuine authorized customer tenants, complete dynamic field/real persistence and consumer ACK, >750KB split/outbox, customer-specific legal review remain open.
