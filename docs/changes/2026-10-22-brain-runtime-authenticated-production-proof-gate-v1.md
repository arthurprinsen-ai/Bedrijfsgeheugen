# Require authenticated production proof for Netlify-imported Brain runtime
Fingerprint: `delivery|brain|runtime-tenant-proof-skipped-on-backend-release|20261022-v1`.

## Verified failure
GitHub [Production Release Readback #39830412618](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39830412618) on protected merge #4699 confirmed exact Netlify deploy `47f302f9be29be967e35d31edd0e76795f46945b` and refreshed `brain-operating-loop` function, but reported `portal_required=false` and skipped the **existing** authenticated Portal proof step. Exact deployment is therefore real while authenticated tenant outcome is not proven.

## Scoped fix
The single canonical `production-release-readback.yml` keeps website/portal applicability and exact Netlify deploy check unchanged. Independently derive a Brain runtime authentication proof trigger for `brain/operating-loop/`, the Netlify `brain-operating-loop.mjs` entrypoint and its API handler. Invoke the already existing authenticated proof step if this trigger OR normal `portal_required` holds, but only after the exact deploy succeeded. Keep strict PROVEN, matching SHA/deploy, tenant scope, response shape, synthetic user cleanup, bounded retries and fail-closed semantics. Do not manufacture provider receipts, tokens, a second workflow, or claim full two-tenant acceptance.

## Verification
`tests/brain-runtime-authenticated-production-readback-required-v1.test.mjs` covers positive/negative path classification and YAML binding; existing tenant proof contract test remains. Exact-head Required + CodeQL, protected merge, next applicable real runtime deploy, authenticated browser/API and two-tenant readback remain release/terminal proof. Existing history replay and incident skill are reused.
