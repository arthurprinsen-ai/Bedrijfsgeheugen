# Supabase Edge runtime readback for terminal delivery

## Problem

The publication recovery could merge through protected GitHub gates while the post-merge terminalizer still failed with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`. The terminalizer only knew how to prove Netlify runtime through `release.json`; changes under `supabase/functions/**` had no exact production identity route.

## Structural repair

- Add a side-effect-free `GET ?mode=runtime_readback` response to the affected Edge Functions.
- Return only non-secret runtime identity: contract id, function name, normalized source fingerprint, `DENO_DEPLOYMENT_ID`, and region.
- Compute the expected fingerprint from repository source while replacing only the fingerprint declaration with a stable placeholder, preventing self-referential hash drift.
- Route Supabase function paths through one canonical verifier in Production Release Readback and Powerhouse Obligation Terminalizer.
- Keep unknown non-Netlify runtime paths fail-closed.

## Safety

The readback route executes before database/service-role setup and cannot publish, mutate delivery state, or expose secrets. Existing POST publication paths and provider truth checks are unchanged.
