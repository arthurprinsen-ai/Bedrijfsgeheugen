# Canonical production deployment applicability v1

Production Source Snapshot and Production Release Readback now use one shared authority: `tools/site-shell/production-deployment-applicability.mjs`.

This removes the split-brain condition where Readback could decide that a main commit did not require Netlify while Snapshot still attempted OIDC/proxy transport, deployment, browser proof and self-heal. Governance-only changes, `tools/ci/`, website release-risk policy changes and Supabase-only changes no longer trigger Netlify production delivery. Website, Portal V2 and Netlify-hosted runtime changes still require exact deployment and readback.

The source snapshot remains available for explicit manual `deploy=true`; fail-closed production identity checks are unchanged when deployment is applicable.
