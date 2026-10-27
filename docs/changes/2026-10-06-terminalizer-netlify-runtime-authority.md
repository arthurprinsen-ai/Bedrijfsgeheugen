# Terminalizer Netlify runtime authority — 6 October 2026

## Trigger

The terminalizer for the production-readback pricing recovery failed with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK` after PR #3815 merged. The only material runtime path was `tools/site-shell/apply-commercial-pricing-v1.mjs`, which is part of the canonical Netlify build command.

## Root cause

Production readback had two authorities. Verifier-only paths already came from `brain/contracts/production-readback-v1.json`, but Netlify-runtime applicability was still encoded as a separate shell `case` list inside the terminalizer. That list omitted build-writer scripts, so real Netlify runtime changes could be misclassified as unwired runtime.

## Correction

The production-readback contract now owns explicit Netlify runtime prefixes and exact paths. `production-supersession.mjs` exposes the shared classifier, and the terminalizer delegates to that classifier. Exact verifier-only paths take precedence, so readback tooling does not cause unnecessary deployments.

The regression explicitly covers the final pricing writer, static i18n cache inputs, Netlify functions and a verifier-only live-contract path.
