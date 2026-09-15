# Brain obligation transition atomic CAS v2

Contract context: `powerhouse-repo-production-migration-lineage-v1`

## Incident

While closing the production→GitHub migration-lineage obligation after PR #1604 had merged and both GitHub main and the Supabase migration ledger had been read back, the canonical `brain_transition_obligation` RPC returned `STATE_VERSION_CONFLICT` for obligation `ae196434-4cfc-423e-a628-a8dd8c4a42d4` even though production readback showed `version = 1` and the requested expected version was also `1`.

The false conflict reproduced when the expected version was passed directly from the canonical row. A separate `FOR UPDATE` diagnostic on the same row proved `version = 1`, `version = 1::bigint = true` and `version IS DISTINCT FROM 1::bigint = false`.

## Root cause boundary

The failure is isolated to the existing RPC's composite pre-read CAS path. The obligation row itself and its version are valid. Direct service-role UPDATE is intentionally unavailable, so bypassing the mutation owner is not the permanent solution.

## TDD proof

`tests/supabase-brain-transition-obligation-atomic-cas-v2.test.mjs` was committed first. BRAIN backend then failed on the test-only head because no `*_brain_transition_obligation_atomic_cas_v2.sql` migration existed. Only after that RED proof was the production implementation applied.

## Fix

Production migration `20260915161019_brain_transition_obligation_atomic_cas_v2` replaces the pre-read/compare path with a single atomic compare-and-swap:

`UPDATE public.brain_obligations ... WHERE id = expected_id AND version = expected_version RETURNING *`.

If the atomic update affects no row, the RPC then distinguishes `OBLIGATION_NOT_FOUND` from `STATE_VERSION_CONFLICT`. SECURITY DEFINER and service-role-only execution remain unchanged.

## Prevention

The regression contract requires:
- exactly one canonical migration for this fix;
- atomic `id + version` CAS;
- no composite `SELECT * INTO v_current` pre-read;
- explicit stale-version failure;
- unchanged service-role-only function ownership.

The exact production migration version is also recorded in `config/supabase-production-migration-lineage.json`. The original lineage obligation must remain OPEN until this production migration is present on protected GitHub main, required CI is green, both stores are read back, and the repaired RPC itself successfully transitions the obligation to `FULFILLED`.
