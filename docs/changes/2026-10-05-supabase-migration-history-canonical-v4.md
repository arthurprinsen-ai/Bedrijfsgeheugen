# Supabase migration-history canonical parity v4

## Problem
Current main contained all 564 production migration versions, but also 156 repository-only timestamp aliases and two version/name collisions. That made the executable lane non-canonical even though remote-only count was zero.

## Structural fix
- keep exactly the 564 production-backed version+name identities in `supabase/migrations`;
- move all 156 repository-only aliases byte-for-byte to `supabase/migration-history/repository-only/`;
- replace the two colliding version identities with the exact SQL stored in the production migration ledger;
- refresh `supabase/migration-history.lock.json` from live production;
- fail closed if remote-only, repository-only, version/name drift, duplicates or empty migration SQL reappear.

## Verified repository/production parity
- production: 564
- executable repository lane: 564
- remote-only: 0
- repository-only: 0
- version/name mismatches: 0

This is not TERMINAL_GREEN until hosted Supabase Preview completes a fresh replay on the exact PR HEAD, all required checks are terminal green, the PR is merged through protection, and production migration-history readback remains exact.
