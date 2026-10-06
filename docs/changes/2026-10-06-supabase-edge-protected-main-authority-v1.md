# Supabase Edge protected-main production authority

## Escaped defect

During LinkedIn company OAuth recovery, Supabase production Edge source advanced independently of protected Git lineage. The live publisher moved through v109, v111 and v113 while recovery PRs were still validating. Every new production version made the previous exact-source candidate stale and caused another successor PR.

## Structural repair

Supabase Edge **deployment** is now its own material authority, separate from social publication authority.

- One owner: `github-supabase-edge-production-authority`.
- One source of truth: protected current `main`.
- One production promotion workflow: `.github/workflows/supabase-edge-production-authority.yml`.
- Direct chat/agent/provider production deploy is forbidden.
- Promotion is single-flight and rejects stale `main`.
- Supabase CLI is pinned to 2.119.0.
- Changed functions are deployed from exact Git source; shared/config changes expand to all functions.
- Provider source is downloaded after deployment and must byte-match the exact current-main entrypoint.
- Missing deployment credentials or provider/source drift fails closed.

## Boundary

The repository cannot revoke a Supabase account-level personal access token by itself. True credential revocation remains an account-level control. This repair removes direct deploy from the permitted agent/runtime authority model and makes the GitHub production environment the canonical automation route.
