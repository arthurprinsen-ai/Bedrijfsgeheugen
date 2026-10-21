---
name: powerhouse-tenant-identity-archive-contract
description: Use when repairing BRAIN tenant-identity SQL source-contract failures caused by archived Supabase migration paths; preserve real SQL evidence and security assertions.
---

# Tenant identity historical SQL source contract

Fingerprint: `ci|brain-baseline|tenant-identity-archived-sql-source-contract|v1`.

Historical applied migrations archived under `supabase/migration-history/repository-only/` are read-only source evidence, not executable new migrations. Existing active BRAIN tests should read the exact source from this archive when verifying a historical security invariant. Do not create empty placeholders, copy already-applied SQL into `supabase/migrations/`, mutate Supabase migration history, or relax tenant-isolation tests to make a release green.

Specific existing contract: `tests/supabase-tenant-identity-hardening-contract.test.mjs` reads `supabase/migration-history/repository-only/20260915170000_powerhouse_tenant_identity_hardening_v1.sql`. Its five tests retain 17 positive source predicates and both negative RLS/member-helper checks. `tests/brain-tenant-identity-archive-source-v1.test.mjs` guards the source pointer, positive SQL semantics and forbidden patterns. These are source checks, **not** verified production tenant isolation.

Keep full exact-head BRAIN backend, Required, CodeQL, protected merge, production readback, and genuine authenticated two-tenant acceptance fail closed. The shared original obligations remain #3742 / #4215; blocked candidate #4573 must not be amended by an unrelated writer.
