# 2026-09-20 — Shared Netlify runtime deploy-impact gap

Observed after PR #2505:
- GitHub Production Release Readback completed successfully.
- Netlify current still referenced the previous production SHA.
- The changed code lived under `platform/api` and `platform/saas`, which are bundled into Netlify Functions but were not included in `netlifyRuntimeRequired`.

Root cause:
The readback workflow only treated direct `netlify/functions/` changes as Netlify runtime deployment changes.

Fix:
- Treat shared runtime prefixes under `platform/api`, `platform/saas`, `platform/connectors`, and `platform/read-models` as deploy-relevant.
- Touch `netlify/functions/portal-connectors.mjs` in this recovery candidate to force an immediate connector runtime rebundle.
- Pin the behavior in the production-readback contract and tests.

Prevention:
A production readback may not return deployment-not-applicable when a shared module that is part of a Netlify Function bundle changed.
