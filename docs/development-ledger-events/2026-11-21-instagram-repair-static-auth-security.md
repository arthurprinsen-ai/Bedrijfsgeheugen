# Security incident — Instagram auth repair function uses static request credential

Date: 2026-11-21. Existing owner: Bedrijfsgeheugen Powerhouse Security Operations / original Supabase Edge release lane.

## Verified starting point
An ACTIVE Supabase Edge Function (original slug `powerhouse-composio-instagram-auth-repair`, verify_jwt=false, provider v9) checked a fixed literal request header before using a service-role Supabase client and a provider API key. Its runtime source was accessible to the authorized management connector; its fixed shared credential was not a suitable secret and must not be copied into documentation or tests. The response passed raw provider `auth_config_details` through to the caller, which could include sensitive configuration. No successful unauthorized access is proven. The production source was not present in GitHub's main branch; this also creates source/runtime drift.

## Containment implementation
- Bring the actual function under the original GitHub source with a dedicated `index.ts` and a reviewed `security.mjs` helper already deployed for another protected maintenance endpoint.
- Reject all methods except POST; reject missing, malformed or non-server credentials before reading environment service-role key, connecting to Supabase or calling Composio.
- Allow only exact server-side legacy service-role bearer or current default `sb_secret_` apikey, validated using SHA-256 digest comparison. Disallow the old fixed header, anonymous callers, publishable keys and user JWTs.
- Enforce no-store, 9-second upstream timeout, bounded sanitized response (`auth_config_count` rather than raw provider credential fields), and sanitized failures.
- Retain verify_jwt=false only because Supabase's legacy JWT gate cannot authorize modern secret apikeys; the in-function guard now handles this, following https://supabase.com/docs/guides/functions/auth.
- Add negative/positive security tests to the **existing** Security Operations workflow; no duplicate watcher, no Make.

## Release contract
1. Exact-source regression passes against the production branch; protected PR is checked and promoted without bypassing mandatory rules.
2. Supabase deployment includes BOTH `index.ts` and `security.mjs`; provider reports ACTIVE and unchanged verify_jwt=false with the new guard.
3. Provider source readback verifies authorization BEFORE privileged operations, removal of the static credential check and removal of raw provider configuration from response.
4. An ordinary unauthenticated POST returns 401 and GET returns 405, without any database/provider maintenance occurring. Never test a real privileged operation with user credentials.
5. If a documented external caller is discovered, migrate it to approved server-only authorization. The old fixed header must not be re-enabled.
6. Record provider version/time and keep the canonical original release owner responsible. Do not mark green on the basis of a PR or CI alone.

## Scope and open items
This patch does NOT rotate the Composio API key or the Supabase service-role credential, since no exposure of those values has been demonstrated. It also does not repair unrelated endpoints, prove account MFA, or assert a penetration test. The GitHub repository's public visibility remains a separately recorded governance decision.

## Emergency production containment — independently observed

- Supabase existing function `powerhouse-composio-instagram-auth-repair`: version 9 replaced by version **10**, provider `ACTIVE`, `verify_jwt=false` retained with in-function server-only authorization. Both provider source files independently read back **byte-identical** to this PR's `index.ts` and `security.mjs`.
- Direct unauthenticated production HTTP readback: GET -> **405**; POST with no credential -> **401**; POST with invalid former-style recovery header -> **401**. No real privileged request was executed.
- Checked that no fixed header literal is present in the deployed request guard and no raw provider auth configurations are returned.
- Seven local security and monitor regressions passed. The new `tools/security/verify-instagram-repair-auth.mjs` also passed against the actual original Supabase endpoint with the same negative statuses.
- **Important release boundary:** the provider hotfix is live, but the scheduled monitor is only a **PR candidate** until protected merge of changes to `.github/workflows/security-operations-proof.yml`. The current main-branch workflow must not be claimed to contain the new checker yet. Preserve original Security Operations ownership; avoid duplicate schedulers.
- Rollback: do not restore the former static header credential. Revert through the existing original protected release owner to another verified server-only credential path if a documented consumer is affected.
