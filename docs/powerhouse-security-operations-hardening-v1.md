# Powerhouse Security & Operations Hardening v1

Status snapshot: 2026-09-16 (Europe/Amsterdam)

## Authority and design

This hardening extends the existing Powerhouse public-RLS guard. It does not create a second security control plane.

Core rule:

- `INTENTIONAL_DENY_ALL_CLIENTS`: public table has RLS enabled, no RLS policy, and neither `anon` nor `authenticated` has direct SELECT/INSERT/UPDATE/DELETE privileges.
- `POLICY_REQUIRED`: public table has RLS enabled, no RLS policy, but a normal client role does have direct DML privilege. This is a security obligation and must fail closed until an explicit tenant/user policy contract is implemented or the client grant is revoked.
- `POLICY_PRESENT`: at least one RLS policy exists.
- `RLS_DISABLED`: security obligation; the existing Powerhouse RLS guard is responsible for enabling RLS.

The classifier and audit are readback-only. They never auto-create RLS policies and never infer tenant/user semantics from column names alone.

## Production evidence captured before this change

### RLS

- Supabase advisor reported 103 public tables with RLS enabled and no policy.
- Direct catalog/readback classified all 103 as no direct `anon`/`authenticated` DML privilege.
- Result at capture time: **103 intentional deny-all/client-closed; 0 policy-required**.
- The only client-selectable dependent view found for this set, `bg_gezondheid_nu`, has `security_invoker=true`.
- Client-executable functions referencing no-policy tables were not `SECURITY DEFINER`, so they do not bypass caller privileges through a definer context.
- Existing `powerhouse_public_rls_guard_scan()` and `powerhouse_public_rls_on_create()` are `SECURITY DEFINER`, pin `search_path=pg_catalog`, and are not executable by `anon` or `authenticated`; they continue to be the authority for ensuring RLS is enabled.

### Password Auth

- Production contains 1 Supabase Auth user with a password hash and successful sign-in history.
- Supabase security advisor reports Leaked Password Protection Disabled.
- Therefore this is a real hardening obligation, not a hypothetical portal setting.
- This repository change cannot claim the provider-side Auth setting has been enabled. Closure requires provider configuration readback showing leaked-password protection enabled.

### Index housekeeping

- PostgreSQL statistics reset timestamp observed: 2026-07-24 08:28:18 UTC.
- A direct zero-scan inventory includes primary/unique constraints and Supabase-managed auth/storage indexes; zero scans alone are therefore not deletion evidence.
- Public zero-scan inventory at capture time: 115 indexes total; 63 were non-primary/non-unique/non-constraint candidates, approximately 1096 kB combined.
- **No index is removed by this hardening.** A candidate may only be dropped after workload/query-plan evidence proves it is redundant and after constraint/FK/provider-managed exclusions.

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

### IAM

- Database-role review confirms `anon` and `authenticated` cannot login and do not bypass RLS; `service_role` bypasses RLS as expected; observed elevated roles are Supabase-managed/admin roles.
- This does not prove a complete Supabase dashboard/team, GitHub, Netlify, Notion, Buffer, provider, or human-access IAM review. Those planes require separate identity/permission evidence.

### Backup / restore / disaster recovery

- No destructive restore was performed during this hardening run.
- Native backup availability or plan entitlement is not equivalent to a tested restore.
- A DR gate remains open until a dated restore exercise proves backup availability, restore into an isolated target, application/data validation, measured RTO/RPO, and cleanup/rollback evidence.

## Regression contract

`tests/powerhouse-security-operations-hardening-v1.test.mjs` requires:

1. explicit intentional-deny-all vs policy-required classification;
2. `security_invoker` for the projection and pinned `search_path` for the audit function;
3. no `anon`/`authenticated` access to the audit objects;
4. service-role-only read/execute access;
5. no mass `CREATE POLICY` behavior;
6. no `DROP INDEX` behavior.

## Completion semantics

This hardening capability may be called `LIVE & BEWEZEN` only when its migration is merged, applied in production, and production readback returns `policy_required=0` and `rls_disabled=0`.

The **whole Powerhouse security/operations layer must not be called fully complete** while provider-side leaked-password protection, a tested DR restore, complete credential-rotation proof, and full cross-platform IAM review remain unverified.
