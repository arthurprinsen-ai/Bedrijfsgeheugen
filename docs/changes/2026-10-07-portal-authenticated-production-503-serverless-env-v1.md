# Portal authenticated production 503 — serverless env API repair

## Observed production failure

Protected PR #4097 merged the autonomous authenticated production proof and Netlify published exact main `e30cf09cf7a1f0bddffd334e191fcb0c2021b7ea` as deploy `6ac6b2bc943e4e00084ffce2`. The real temporary Netlify Identity user and JWT reached `/api/portal-ondernemersdata`, but the production proof remained red with `AUTHENTICATED_PORTAL_API_HTTP_503`.

The endpoint has a deliberate 503 fail-closed path when its server-side Supabase credential is unavailable: `SUPABASE_SERVICE_KEY_MISSING`.

## Root cause

`portal-ondernemersdata.mjs` is a Netlify serverless Function but read its runtime variables with `Netlify.env`. That is the Edge Functions environment API. Serverless Functions use `process.env` for scoped runtime environment variables.

This is a recurrence of the already recorded 21 September incident `netlify-serverless-env-api-v1`; it is not an Identity defect, data defect or reason to add a second secret.

## Structural repair

- replace the serverless env reader with `process.env[name]`;
- keep the existing canonical Supabase credential names and fail-closed 503 behavior;
- add a regression to the canonical authenticated-production-proof test that forbids `Netlify.env` in this endpoint;
- write the recurrence into Brain learning, development ledger, Netlify production-truth skill and the canonical System Map;
- keep the exact deploy authenticated proof as terminal authority.

## Terminal truth

The repair is not `LIVE_BEWEZEN` until protected merge, exact-main Netlify deployment and a `PORTAL_AUTHENTICATED_PRODUCTION_PROOF_V1` receipt with HTTP 200, tenant-scope proof, valid payload shape and deleted synthetic user.
