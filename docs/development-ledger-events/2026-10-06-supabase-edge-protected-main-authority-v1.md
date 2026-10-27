# 2026-10-06 — Supabase Edge protected-main authority

Obligation: `supabase-edge-protected-main-authority-20261006-v1`

Observed:
- LinkedIn company recovery source was repeatedly frozen into writer-isolated PRs;
- while those PRs were still validating, live `powerhouse-social-publisher` advanced from v109 to v111 and then v113;
- `powerhouse-composio-linkedin-setup` v23 and `powerhouse-content-loop` v31 also differed from current Git main;
- repository searches found no checked-in GitHub workflow performing those direct Edge deploys;
- therefore a parallel provider write-authority existed outside protected-main delivery.

Implemented:
- register Supabase Edge production promotion as a material obligation with one GitHub Actions owner;
- forbid direct chat/agent/provider production deploy in inherited AGENTS governance;
- add current-main-only, single-flight Supabase Edge promotion workflow;
- pin Supabase CLI;
- deploy only current-main source and perform provider source read-after-write;
- fail closed on stale main, missing credential, invalid scope or provider/source mismatch;
- add regression tests that reject re-enabling direct provider deploy.

Next lineage:
- protected-merge this control-plane repair;
- verify the production environment can execute the canonical workflow;
- snapshot the then-current live Edge source exactly once into Git;
- protected-merge parity;
- only then resume the existing LinkedIn company publication claim.
