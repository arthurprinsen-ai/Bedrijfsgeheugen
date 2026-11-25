# Retire legacy Netlify Buffer social writer — 15 October 2026

## Incident
Netlify request logs showed repeated HTTP 502 `ENOENT: no such file or directory, open '/var/task/netlify/config/social-channel-identity-contract.json'` from `social-publication-delivery.mjs` and its deployment event import. The file exists in GitHub but was not packaged in the function.

## Correct authority
`supabase/functions/powerhouse-social-publisher/index.ts` remains the canonical send authority with provider ACK/readback, duplicate claim, reviewer, identity and quality controls. On 15 October, Supabase verified LinkedIn company publication and reported a provider ACK for personal LinkedIn. Re-enabling a second Buffer sender by adding the missing JSON to Netlify's function bundle would risk duplicate messages and violate the no-Buffer operating policy.

## Change
- Convert `netlify/functions/social-publication-delivery.mjs` to an HTTP 410 retired compatibility endpoint; delete its 10-minute schedule and all outbound credentials/side effects.
- Convert `netlify/functions/social-publication-delivery-deploy.mjs` to a no-op deploy hook; no second publication attempt.
- Retain side-effect-free historical helpers `localDayWindow` and `providerReconciliationState` for legacy tests.
- Add a fail-closed runtime regression proving no outbound transport and no delivery claim.

No change to Supabase social function deployment, tokens, recipient policy or customer consent. Release acceptance needs Required/CodeQL green, protected merge, Netlify exact-commit deployment, and independent runtime readback. A retired old endpoint is NOT a new publication or all-green commercial proof.
