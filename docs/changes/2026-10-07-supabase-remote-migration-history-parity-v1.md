# Supabase remote migration history parity v2

The terminal migration-history recovery now closes the race between repository reconciliation and a concurrently advancing production history.

After PR #4079 restored six remote-only migrations, production gained one additional canonical migration while the recovery was being merged:

- `20261007190600_security_definer_browser_execute_closure_v1`

Its exact production statement is mirrored into `supabase/migrations`. No production migration-history row is deleted, rewritten, renumbered or fabricated.

The canonical parity regression is also repaired for Node 24 by importing `fileURLToPath` from `node:url`. It now explicitly verifies all seven recovered production migrations and the security-definer browser-execute closure.

Terminal parity is no longer considered complete from a single early snapshot: production history must be compared with exact current main again after protected merge.

## Terminal current-main reconciliation

Production is currently at 634 migration versions. Version `20261007192514_security_trust_posture_verified_no_open_findings_v1` was the sole remaining remote-only migration and is mirrored here from the exact production statement. The migration-history lock is refreshed from the same production readback. This candidate is rebuilt on current main `80a96c77a4eac555abf66aa3fb03c6848b37a48a`; `20261007190600` is already present there byte-for-byte and is no longer a candidate delta.
