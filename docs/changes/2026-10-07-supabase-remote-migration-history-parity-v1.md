# Supabase remote migration history parity v2

The terminal migration-history recovery now closes the race between repository reconciliation and a concurrently advancing production history.

After PR #4079 restored six remote-only migrations, production gained one additional canonical migration while the recovery was being merged:

- `20261007190600_security_definer_browser_execute_closure_v1`

Its exact production statement is mirrored into `supabase/migrations`. No production migration-history row is deleted, rewritten, renumbered or fabricated.

The canonical parity regression is also repaired for Node 24 by importing `fileURLToPath` from `node:url`. It now explicitly verifies all seven recovered production migrations and the security-definer browser-execute closure.

Terminal parity is no longer considered complete from a single early snapshot: production history must be compared with exact current main again after protected merge.


## Provider-stamped terminal reconciliation

During final production closure, the official Supabase migration-authority was invoked with the exact merged SQL of `20261007190653_security_trust_posture_verified_no_open_findings_v1`. Supabase preserved that call as a new immutable production migration version `20261007192514`.

That production row is not deleted or rewritten. The repository now mirrors `20261007192514_security_trust_posture_verified_no_open_findings_v1.sql` with the same replay-safe SQL as the canonical `190653` migration. Terminal parity therefore includes a mandatory post-apply production-history readback.
