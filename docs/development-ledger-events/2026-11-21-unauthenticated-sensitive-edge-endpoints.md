# Security incident — unauthenticated privileged diagnostics

Date: 2026-11-21. Owner: original Security Operations / backend release.

## Observed production condition
Supabase project `adhjwmvyoixzjtmiroln` exposed two ACTIVE Edge Functions with `verify_jwt=false` and no application authorization:

- `bg-master-control` v9: created a Supabase service-role client on GET/POST and returned internal review-log, active writing rules, revenue outcomes and operational evidence. No request authentication before access. A request-based authorization guard was absent in the exact deployed source.
- `db-pooler-introspect-v1` v14: connected to the privileged Postgres pooler on any request and returned raw exception text if the database failed. No request authentication.

These are **directly evidenced authorization gaps** in source, not proof of actual malicious access. No secrets were extracted or tested against live production.

## Fix and boundary
- Preserve the existing function names, database operations and output structure for authorized internal callers.
- Require `POST` and the same existing `isAuthorizedRepairRequest` runtime guard used by the already deployed `db-pooler-repair-v1` endpoint, before DB credentials, client construction or SQL. Valid credentials: exact legacy `service_role` Bearer **or** the modern Supabase `sb_secret_` API key on `apikey` (never public anon/publishable keys or ordinary user JWTs). Cryptographic SHA-256 comparison; no hardcoded secrets.
- Unauthenticated POST => HTTP 401, GET => HTTP 405; no raw internal exception text; `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- `verify_jwt=false` is retained **only** to support custom secret `apikey` authentication (modern non-JWT format). The in-function guard is mandatory.
- Test negative and positive authentication cases, and check guard-before-DB ordering. Verify exact provider source and version after deployment.

## Independent proof and release boundaries
- Source test: `node --test tests/brain-security-sensitive-edge-auth-20261121.test.mjs`.
- Before claiming secure live: protected branch checks and Supabase ACTIVE provider readback proving new source at each function, plus non-destructive HTTP 401/405 rejection probes where safe.
- This change reduces two identified access-control risks. It does **not** prove the entire platform is hack-proof. Remaining exposure: public GitHub source repository; grandfathered token-gated anon SECURITY DEFINER cron; per-function audit of remaining `verify_jwt=false` endpoints; public MO14 team names without site access controls; strict browser CSP only scoped for existing coach routes.
- Never disable original content/workflow executors for recoverable auth issues and never use Make.

## Production hotfix — independently verified 2026-11-21

- `bg-master-control` previous ACTIVE v9 was replaced with **ACTIVE v10** using the same protected `POST + isAuthorizedRepairRequest` guard as the existing service-role-only repair endpoint. The exact deployed `index.ts` and `security.mjs` bytes were retrieved and matched to this GitHub branch.
- `db-pooler-introspect-v1` previous ACTIVE v14 was replaced with **ACTIVE v15** with the same authorization boundary. The deployed `index.ts` and `security.mjs` matched GitHub exactly.
- External **unauthenticated** HTTPS readback on both production endpoints gave GET **405** and empty POST **401**, with `Cache-Control: no-store` and `X-Content-Type-Options: nosniff` in every rejected response. No privileged requests or real service-role credentials were used in these acceptance probes. This proves denial of those unauthenticated methods, not security against every possible adversary.
- A local Node v24 regression in the isolated test environment passed **11/11** including ordinary-user and public API keys, valid fictional server credentials, guard ordering, and fail-closed monitoring. The existing original security monitoring script (`tools/security/verify-public-security-headers.mjs`) now checks both edges without credentials, in the **existing** scheduled `security-operations-proof.yml` workflow after protected merge. It does not create another scheduler.
- The entire read-only live security sweep returned **6/6 PASS**: Bedrijfsgeheugen main site, PW shared homepage, PW zaal, PW field, both patched Supabase functions.
- Source PR remains **candidate until protected merge and Required/CodeQL completion**; the two Supabase hotfixes are separately provider-live and independently checked.
- **Residual risks:** repository `arthurprinsen-ai/Bedrijfsgeheugen` is public (source history public); the token-gated anonymous `SECURITY DEFINER` cron RPC remains pending a safe external-caller cutover; 100 out of 126 ACTIVE Edge Functions currently report `verify_jwt=false` (many use custom auth/webhooks; each must be reviewed separately, not mass changed); the children's PW app is publicly reachable without a team password and uses local client storage. Do not promise absolute immunity.

## Independent original migration-lock dependency — verified 2026-11-21
- Required PR #6102 preflight was blocked by a separate original migration-history integrity failure: the executable source contained 889 nonempty SQL files and live Supabase provider `supabase_migrations.schema_migrations` via `list_migrations` recorded 889 versions, but `supabase/migration-history.lock.json` still listed 888.
- The sole missing exact **already-applied** provider record: `20261121090000_reconnect_original_email_reply_in_commercial_stage14`. The original executable SQL file exists in main and in this branch, and was independently read. No missing SQL, no synthetic version, no new applied DDL, no function replacement, no changes to existing historical identities.
- Reconciled that one exact version/name at the end of the original canonical lock and updated capture time. A strict equality assertion checked all **889 ordered provider (version, name) pairs** against the 889 Git lock entries before writing. No runnable migration was added or deployed in this correction.
- The security hotfix remains live and independently proven; lock reconciliation is source-only, subject to original Required/CodeQL, rather than bypassing migration gate. If the live provider identity changes again, the gate must fail closed and reconcile from fresh readback.

## Current provider revision — protocol readback
- Added the original `INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1` coverage marker to the two already secured functions. The marker declares existing Security Operations monitoring; it does **not** claim in-request incident writes.
- Current deployed source after reupload: `bg-master-control` **ACTIVE v11** and `db-pooler-introspect-v1` **ACTIVE v16**, exact source and helper bytes independently matched to GitHub, guard still before DB operation. Earlier v10/v15 are historical hotfix verification versions.
