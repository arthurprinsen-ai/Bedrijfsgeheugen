# Portal Identity JWT tenant-claim release recovery — 2026-10-29

## Provider evidence and impact
GitHub Production Release Readback [run #40909428921](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40909428921) failed on protected main `eead20219269341e1933bd33d3a10c7bf2ad43e9`, while Netlify deploy `6ae370a59cc60cf4ee32e9d1` was independently READY on that exact commit. The **separate** authenticated production gate returned `IDENTITY_TENANT_CLAIM_MISMATCH` on 30 retries. No portal customer data was requested after the failed claim check; actual cross-tenant isolation could not be proven. Exact cause inside the provider remains unknown.

## Existing canonical lane; narrow, fail-closed repair
In the current `platform/api/portal-authenticated-production-proof-core.mjs`:
1. Create a *synthetic* Netlify Identity user for each of the two distinct tenant slots. Preserve guaranteed deletion even when subsequent operations fail.
2. Read back the user using `admin.getUser`. If this user has no matching admin-owned `appMetadata.tenantId`, set it via `admin.updateUser({app_metadata:...})`, preserving existing admin fields; read it back again. If it remains absent, return typed `IDENTITY_ADMIN_TENANT_METADATA_NOT_PERSISTED` **without requesting a bearer token**.
3. Only then exchange the password for the provider-issued JWT. Require `sub` and signed `app_metadata.tenantId` to match exactly, as before. Do **not** infer tenant authority from `user_metadata` or a request header. Require independent authenticated tenant HTTP 200, response shape, no cross-tenant record, both user deletions, exact source SHA and Netlify deploy ID.
4. Existing one PR/single writer and native protected Required/CodeQL/Main → Netlify pipeline are unchanged. No extra cron, publisher, bypass or new staging preview.

## Verification plan
- Unit tests: standard two-tenant success; provider ignores metadata at create but admin update persists it; admin update does not persist it (fail closed and delete); wrong JWT claim (fail closed and delete); downstream HTTP failure and cleanup failure.
- Full PR Required/CodeQL, exact head and protected merge.
- Netlify production provider `ready` and exact `commit_ref`.
- **Independent** Production Release Readback on final production commit must prove two signed JWTs, two isolated tenant API requests, and cleanup. Prior success on a candidate or local test is insufficient.

## Brain/incident propagation
Existing `brain_failure_registry` fingerprint `portal|production-auth|jwt-tenant-claim-mismatch|20261029`, canonical `powerhouse_runtime_events` evidence `0f8e4c3f-5715-460b-8c2e-fbc3fa6b0a98`; [GitHub owner issue #5118](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5118). Keep OPEN until both source fix and true provider-backed two-tenant readback are independently proven. Source-level acceptance does not imply that all runtime agents adopted updated skills or that any business outcome was achieved.
