# MKB Probleemradar production refresh — 24 September 2026

## Observed state

The three MKB Probleemradar blogs were merged through PR #2735 and exist on protected `main`. Netlify production was then read back and still reported commit `e648f6c8e07bc2185daab6c71b0adff26d020d68`, older than the blog merge.

## Action

This lineage adds an operational refresh marker to the canonical `.github/workflows/production-source-snapshot.yml`. On protected merge, that workflow packages the exact current main source and uses the existing authorized Netlify transport.

## Safety and proof

No Netlify credential is stored in repository content or PR metadata. The release remains fail-closed until Netlify reports an exact current-main production identity and the three public blog routes are readable.

The existing regression `tests/brain-netlify-deploy-auth-hard-boundary-v2.test.mjs` remains the canonical guard for deploy-auth handling.
