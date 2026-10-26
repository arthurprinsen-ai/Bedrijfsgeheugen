# Netlify pinned session health — incident and correction
Obligation-ID: `netlify-pinned-session-provider-health-20261019`
Fingerprint: `netlify|composio|account-visible|session-execute-400|20261019`
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4437

## Observation
Bridge now discovers one authorized Netlify account in 50 scanned accounts, but Composio v3.1 session execute HTTP 400 at read-only health. Last known Netlify live deploy: `6ad5c80e404d0a632f2b276d`, commit `d3a73d8816c384c6a745b68178b4691727d31000`; current GitHub protected main is ahead.

## Prevention
Add explicit session `tools` positive allowlist matching `preload`, and learn only sanitized 400 validation field/type and requested-tool-exposed boolean. No auth weakening, no logging secret material or fallback to unrelated account. Tests: `tests/brain-netlify-session-tool-exposure-v1.test.mjs`.

## Closure boundary
A green static test is not a successful provider operation. Must prove actual OIDC health and exact published Netlify source, with protected release and independent production readback.
