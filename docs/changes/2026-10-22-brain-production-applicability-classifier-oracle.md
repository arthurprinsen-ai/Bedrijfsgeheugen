# Canonical Netlify deployment applicability — inherited BRAIN oracle repair

Fingerprint: `ci|brain|production-applicability-canonical-classifier-oracle-drift|20261022-v1`
Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742
Full baseline: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071 (3,526 / 3,171 passed / 355 failed).

## Observed regression
Two existing assertions in `tests/brain-production-runtime-applicability-v1.test.mjs` (TAP #2367 and #2370) expected the production workflows to list paths and calculate deployment applicability inline. The active workflows instead import `deriveNetlifyDeploymentApplicability` from the existing canonical authority. No evidence of a production classifier defect follows from these obsolete source-text expectations alone.

## Fix and negative canaries
Keep all four original test cases, and exercise the actual canonical classifier for verifier-only sources (no Netlify deploy) and five runtime prefixes, a shared AI-runtime dependency, and the pricing website (deployment and browser verification required). Verify both workflows delegate to the same helper and preserve production supersession controls. Do not alter the runtime classifier, workflows, scheduler, auth, tenant data or production deployment.

## Fail-closed release
The candidate remains draft and not live until its exact head passes Required CI, CodeQL and historical/shadow/canary regression, and the *single integrated* full Unified BRAIN produces zero failures on one current-main-compatible SHA. Existing #3742 migration clean-room and #4215 authenticated two-tenant acceptance are independent gates. Do not subtract counts observed on differing commits or skip negative deployment checks.
