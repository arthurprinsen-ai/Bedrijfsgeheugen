# 2026-10-05 — Supported Supabase migration repair control #3742

Obligation: `supabase-supported-migration-repair-3742-v1`

## Observed failure
The canonical #3742 recovery has four replay-only migration identities whose production effects are already proven, while their versions are absent from production migration tracking. Pull-request execution correctly has no production Supabase credentials, so repair cannot safely occur in PR context.

## Structural action
Install one trusted-main-only workflow that:
- resolves the exact canonical #3766 writer lease;
- accepts only the four effect-verified replay versions;
- proves pre-repair drift equals exactly those local-only versions;
- runs only official `supabase migration repair ... --status applied`;
- proves zero drift afterward via `supabase migration list --linked`;
- advances #3766 only with force-with-lease.

## Safety
No replay SQL is executed in production. No direct `supabase_migrations` writes are permitted. A missing credential, unexpected drift, changed writer head, or failed provider readback keeps the obligation open.

## Terminal boundary
This control-plane PR is only a prerequisite. #3742 becomes terminal only after provider repair, fresh exact-head replay/checks, protected merge, and post-merge production readback.
