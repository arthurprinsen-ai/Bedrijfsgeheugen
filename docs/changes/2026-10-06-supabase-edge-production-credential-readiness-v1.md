# Supabase Edge production credential readiness v1

## Problem

The protected-main Supabase Edge production authority existed, but run `37461804855` failed before deployment because the GitHub `production` environment did not provide `SUPABASE_ACCESS_TOKEN`.

The workflow also required the triggering SHA to remain the literal tip of `main`. That is stricter than necessary when later main commits do not touch any Supabase function or Supabase config path.

## Structural repair

- Resolve the exact function scope before enforcing the production credential.
- Record credential readiness as immutable workflow evidence without printing secret material.
- Fail closed only when a real Supabase Edge promotion is applicable and the token is absent.
- Keep `workflow_dispatch` as the one-step replay path after one-time credential provisioning.
- Permit a protected-main candidate to promote after unrelated main movement only when it is an ancestor of current main and there is zero later drift under `supabase/functions/**` or `supabase/config.toml`.
- Fail closed if newer Supabase runtime/config work exists.
- Trigger the workflow on changes to its own control-plane file so its no-op path is regression-tested in production automation.

## Boundary

A Supabase Management API token is an account credential. Repository code cannot create or recover it safely. One-time provisioning of `SUPABASE_ACCESS_TOKEN` in the GitHub `production` environment remains an external credential-control action; after that, deployments and readback are autonomous and protected-main-only.
