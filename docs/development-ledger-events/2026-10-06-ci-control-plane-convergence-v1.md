# 2026-10-06 — CI control-plane convergence v2

Obligation: ci-control-plane-convergence-20261006-v1
Base authority: current main after #3920.

Observed evidence:
- multiple heavy workflows independently allocated pull-request runners;
- Required/Skill Projection used full-history checkout and fetched the complete remote branch set;
- repository discovery reached at least 100 open PRs;
- Supabase provider preview was already available inside Required;
- #3924 proved cross-obligation Supersedes is unsafe;
- #3928 proved a stale full_assurance branch variant conflicted with the canonical Netlify premerge contract.

Installed prevention:
- canonical Required PR ingress;
- bounded exact-base fetches;
- standalone Supabase applicability runner retired with config.toml semantics preserved;
- current-main Netlify governance semantics retained;
- missing Required watchdog;
- same-obligation supersession janitor plus conservative stale-generated cleanup;
- executable regression coverage that forbids reintroduction of full_assurance in this authority.
