# Powerhouse Security & Operations Hardening v1

Status snapshot: 2026-09-17 (Europe/Amsterdam)

## Authority and design

This hardening extends the existing Powerhouse public-RLS guard. It does not create a second security control plane.

Core rule:

- `INTENTIONAL_DENY_ALL_CLIENTS`: public table has RLS enabled, no RLS policy, and neither `anon` nor `authenticated` has direct SELECT/INSERT/UPDATE/DELETE privileges.
- `POLICY_REQUIRED`: public table has RLS enabled, no RLS policy, but a normal client role does have direct DML privilege. This is a security obligation and must fail closed until an explicit tenant/user policy contract is implemented or the client grant is revoked.
- `POLICY_PRESENT`: at least one RLS policy exists.
- `RLS_DISABLED`: security obligation; the existing Powerhouse RLS guard is responsible for enabling RLS.

The classifier and audit are readback-only. They never auto-create RLS policies and never infer tenant/user semantics from column names alone.

## Production evidence captured during this hardening run

### RLS

- Supabase advisor reported 103 public tables with RLS enabled and no policy.
- Direct catalog/readback classified all 103 as having no direct `anon`/`authenticated` SELECT/INSERT/UPDATE/DELETE privilege.
- Result at capture time: **103 intentional deny-all/client-closed; 0 policy-required**.
- The only client-selectable dependent view found for this set, `bg_gezondheid_nu`, has `security_invoker=true`.
- Client-executable functions referencing no-policy tables were not `SECURITY DEFINER`, so they do not bypass caller privileges through a definer context.
- Existing `powerhouse_public_rls_guard_scan()` and `powerhouse_public_rls_on_create()` are `SECURITY DEFINER`, pin `search_path=pg_catalog`, and are not executable by `anon` or `authenticated`; they continue to be the authority for ensuring RLS is enabled.
- Generic Supabase advisor informational findings for RLS-without-policy may remain for intentional deny-all tables; these must not be cleared by adding dummy policies.

### Password Auth — CLOSED & PROVEN

- Production contains 1 Supabase Auth user with a password hash and successful sign-in history, so leaked-password protection is materially relevant.
- Pre-change provider readback: `password_hibp_enabled=false`; Auth, DB and pooler were healthy.
- The provider-side Supabase Auth setting was changed minimally to `password_hibp_enabled=true` without changing other Auth configuration.
- Post-change provider readback: `password_hibp_enabled=true`; Auth, DB and pooler remained healthy.
- Post-change Supabase security-advisor readback no longer reports the prior Leaked Password Protection Disabled warning.
- Project Auth already has TOTP enrollment and verification enabled and refresh-token rotation enabled.

### Privileged RPC exposure — CLOSED & PROVEN

- A fresh Supabase security-advisor scan found `public.powerhouse_reconcile_daily_sales_action_set_v1(date)` was `SECURITY DEFINER` and executable by both `anon` and `authenticated`.
- The function remains `SECURITY DEFINER` because it performs governed service-side reconciliation over protected Powerhouse tables; only its execution boundary changed.
- Migration `20260916195000_daily_sales_reconciler_security.sql` revokes EXECUTE from `PUBLIC`, `anon` and `authenticated` and grants EXECUTE explicitly to `service_role`.
- Production catalog readback after migration: `anon_execute=false`, `authenticated_execute=false`, `service_role_execute=true`; ACL is limited to `postgres` and `service_role`.
- Post-change Supabase security-advisor readback no longer reports either the anonymous or authenticated SECURITY DEFINER execution warning.
- Regression test `tests/supabase-daily-sales-reconciler-security.test.mjs` prevents accidental re-exposure in repository migrations.

### Index housekeeping

- PostgreSQL statistics reset timestamp observed: 2026-07-24 08:28:18 UTC.
- A direct zero-scan inventory includes primary/unique constraints and Supabase-managed auth/storage indexes; zero scans alone are therefore not deletion evidence.
- Public zero-scan inventory at capture time: 115 indexes total; 63 were non-primary/non-unique/non-constraint candidates, approximately 1096 kB combined.
- **No index is removed by this hardening.** A candidate may only be dropped after sustained workload/query-plan evidence proves it is redundant and after constraint/FK/provider-managed exclusions.

### Auth/database connection capacity

- PostgreSQL `max_connections`: 60.
- Snapshot at capture time: 18 total connections, 1 active.
- Supabase advisor reports Auth uses a fixed maximum of 10 database connections and recommends percentage-based allocation for scale.
- Current snapshot does not justify a blind pool-size change. Before material Auth/concurrency scale, switch to percentage-based allocation and verify capacity under representative peak load.

### Secrets

- Vault inventory contains 9 secrets.
- Oldest observed creation: 2026-09-09; newest: 2026-09-10.
- 2 entries show an update materially after creation.
- This is inventory/age evidence only. It is **not** proof that every provider credential has completed an end-to-end rotation and consumer readback.
- Secret values are not to be copied into Powerhouse documentation, logs or learning records.
- Fresh Netlify provider readback on 2026-09-17 confirms `BUFFER_API_KEY` is configured for the Bedrijfsgeheugen project but still reports `is_secret=false`; in the same project, credentials correctly configured as secrets are provider-masked and report `is_secret=true`.
- Repository/runtime evidence links `BUFFER_API_KEY` to the deployed `buffer-social-collect` consumer, where it is used as a Bearer credential for Buffer API calls.
- A prior classification-only management write did not persist secret classification. This is therefore a real unresolved credential-protection defect, not a documentation discrepancy.
- Safe closure is **not** to overwrite the credential blindly. It requires provider-side replacement/rotation, secret classification, post-rotation consumer proof, and revocation or proof of unusability of the superseded credential.

### IAM

- Database-role review confirms `anon` and `authenticated` cannot login and do not bypass RLS; `service_role` bypasses RLS as expected; observed elevated roles are Supabase-managed/admin roles.
- Supabase organization membership was enumerated: the organization currently has a single Owner account, minimizing standing human membership.
- Supabase sole-Owner personal MFA and organization-wide Require MFA enforcement were enabled in the provider UI and saved by the standing Owner; the management connector still does not expose organization-member MFA state for independent readback.
- Netlify provider readback now proves the current Owner has `mfa_enabled=true`, Team PrinsenCo has one standing member and `enforce_mfa=enforced`.
- Notion workspace readback shows one human workspace user and eight bots/integrations. Legacy `Make` remains present while Make is retired in the Powerhouse architecture; the current connector exposes inventory but no integration-disconnect operation.
- GitHub repository identity `arthurprinsen-ai` has current admin permission on `arthurprinsen-ai/Bedrijfsgeheugen`; main remains protected with the required test status check.
- A fresh plugin-directory search on 2026-09-17 returned no Buffer management/IAM connector. Buffer account IAM therefore remains `UNVERIFIED`, not implicitly green.

### Backup / restore / disaster recovery

- Backup availability is now proven: eight consecutive physical backups dated 2026-09-09 through 2026-09-16 are reported `COMPLETED`; WAL-G backups are enabled.
- PITR is currently disabled.
- The available PITR restore API overwrites the current project and therefore was deliberately not used as a DR test.
- No destructive or isolated restore was performed during this hardening run. Backup existence is not equivalent to restore proof.
- The remaining DR gate requires a dated **isolated** restore exercise with application/data validation, measured RTO/RPO and cleanup/rollback evidence. Production must not be overwritten merely to satisfy a test.

## Regression contract

`tests/supabase-powerhouse-security-operations-hardening-v1.test.mjs` requires:

1. explicit intentional-deny-all vs policy-required classification;
2. `security_invoker` for the projection and pinned `search_path` for the invoker-rights audit function;
3. no `anon`/`authenticated` access to the audit objects;
4. service-role-only read/execute access;
5. no `SECURITY DEFINER` in this new audit migration;
6. no mass `CREATE POLICY` behavior;
7. no `DROP INDEX` behavior.

`tests/supabase-daily-sales-reconciler-security.test.mjs` additionally requires the privileged daily sales reconciler RPC to revoke execution from `PUBLIC`, `anon` and `authenticated` while preserving explicit `service_role` execution.

`tests/brain-security-operations-closure-v1.test.mjs` additionally keeps `credential_rotation_end_to_end` fail-closed while the Buffer credential remains unprotected/unrotated and asserts that the canonical contract records the provider exposure, deployed consumer, secret-classification requirement, post-rotation readback requirement and superseded-credential revocation requirement without storing credential values.

## Completion semantics

The RLS classification capability may be called `LIVE & BEWEZEN` only when its migration is merged, applied in production, and production readback returns `policy_required=0` and `rls_disabled=0`.

Leaked-password protection, the daily-sales privileged RPC boundary, Netlify owner/team MFA and the recorded Supabase management MFA action are **CLOSED & PROVEN** under the current closure contract. Backup availability is proven, but restore capability is not yet proven.

The **whole Powerhouse security/operations layer must not be called fully complete** while the tested isolated DR restore, complete credential-rotation proof and remaining cross-platform IAM evidence/cleanup are unverified. Percentage-based Auth connection allocation is a scale-readiness gate rather than a current production defect; index cleanup remains evidence-first and non-destructive until sustained usage/query-plan evidence supports removal.