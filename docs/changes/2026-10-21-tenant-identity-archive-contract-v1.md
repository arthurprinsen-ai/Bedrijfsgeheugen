# Tenant identity BRAIN baseline: archived SQL source pointer

Obligation: `ci-3742-tenant-identity-archive-contract-v1`. Parents: [#3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742), [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215). Blocked original [#4573](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4573).

Immutable source main `d18ef16edac0e62058a51afee21cfe0b52a91e20`; inherited failed [BRAIN run 39554866582](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39554866582): 355 backend failures, reproduced on clean base. Five `supabase-tenant-identity-hardening-contract` cases read `supabase/migrations/20260915170000_powerhouse_tenant_identity_hardening_v1.sql`, which no longer exists in the executable migrations directory.

The exact historical SQL exists at `supabase/migration-history/repository-only/20260915170000_powerhouse_tenant_identity_hardening_v1.sql`, blob SHA `50d899bfa0569cf17661804b8a142cb4aa42d808`. Independent read-only static validation against original assertions established 17/17 required SQL patterns and 2/2 forbidden-pattern checks. The fix replaces **one** source literal and leaves the existing five tests and every assertion otherwise byte-identical. New regression `tests/brain-tenant-identity-archive-source-v1.test.mjs` guards the archive path and both positive and negative SQL semantics. The original security invariants—membership, `auth.uid()`, `intern.mijn_organisaties()`, demo/unverified exclusions, safe policies and benchmark/outcome controls—remain checked.

No SQL migrations, RLS/ACL, backend business logic, scheduler, OAuth, test-skipping, CI gate or customer data changes. **Never resurrect applied historical migration versions in the executable directory merely to satisfy source tests**: previous #3742 evidence shows duplicate-version conflicts.

## Proof boundary

This is a bounded source-level candidate. No exact-head BRAIN/Required/CodeQL success, merge, preview, production or genuine tenant A/B readback is asserted by source inspection. It cannot unblock #4573 by itself; independently owned remaining baseline failures and supported Supabase parity/replay must be repaired without safety waivers. The existing release owner alone performs protected landing and provider readback after all gates pass.
