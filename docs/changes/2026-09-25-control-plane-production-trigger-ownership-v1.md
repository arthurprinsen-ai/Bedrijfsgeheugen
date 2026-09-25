# Control-plane production trigger ownership

Date: 2026-09-25

Fingerprint: `delivery|production-trigger|control-plane-path-ownership|v1`.

A protected-main governance merge started Production Source Snapshot, Production Release Readback and canonical production readback even though the material change affected delivery governance, learning and browser-test infrastructure rather than deployable website/runtime code.

Root cause: the workflow-level `paths-ignore` contract was incomplete. The following are control-plane-only for production-trigger ownership:
- `AGENTS.md`
- `brain/policies/**`
- `tools/delivery/**`
- `tools/site-shell/verify-targeted-website-routes.mjs`

These paths remain subject to protected PR validation, Required lanes, browser regression and Brain/skill closure. They no longer start Netlify promotion/readback solely by changing those files.

This exclusion is intentionally narrow. Deployable website, portal, API, Netlify function, connector runtime and production-bearing paths remain fail-closed and continue to trigger production proof.
