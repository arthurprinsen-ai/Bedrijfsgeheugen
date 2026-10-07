# 2026-10-07 — Supabase terminal history parity v2

## Post-merge evidence

PR #4079 merged with Required, CodeQL and fresh Supabase Preview green. The preview replay applied all 631 migrations through `20261007182000` and deployed 117 Edge Functions; `powerhouse-content-orchestrator` was ACTIVE v47 with the production hash.

Post-merge main then exposed two residual failures:

1. learning canonicalization failed because the new regression called `path.fileURLToPath`, which does not exist; the correct ESM API is `fileURLToPath` from `node:url`;
2. production migration history had advanced concurrently with `20261007190600_security_definer_browser_execute_closure_v1`, so current main again lacked one remote migration file.

## Structural correction

The exact recorded SQL for `20261007190600` is mirrored to GitHub. The regression uses the correct Node API and explicitly verifies the seventh recovered migration and its least-privilege behavior.

Production migration history itself remains untouched. `20261007182000` remains the pending repository migration for the Supabase Git integration to apply once remote/local lineage is exact.

## Terminal acceptance

Exact-head Required + CodeQL + Supabase Preview green → protected merge → production Supabase check applies `20261007182000` → refreshed production/local version comparison has zero missing remote and zero unexpected local versions → failed post-merge learning/revenue checks are rerun and green.
## Lineage continuation

This terminal v2 candidate is not a second migration-history obligation. It is the same `supabase-remote-migration-history-parity-20261007-v1` obligation continued after #4079 post-merge evidence exposed one concurrent production migration and one regression implementation defect. #4084 therefore supersedes #4079 under the same obligation identity and retains one terminal writer.

## Current-main terminal reconciliation

Before the final candidate was rebuilt, remote/local parity showed exactly one remaining remote-only version: `20261007192514_security_trust_posture_verified_no_open_findings_v1`. Production already contained `20261007182000`, `20261007190600` and `20261007190653`. The final candidate therefore mirrors only the remaining production version, refreshes the production history lock, and carries the Node 24 regression fix on current main `80a96c77a4eac555abf66aa3fb03c6848b37a48a`.
