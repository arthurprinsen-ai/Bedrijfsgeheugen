# BRAIN Continuous CI/CD v2.1 — Permanent Summary

Every current and future Bedrijfsgeheugen-connected app, agent, scenario and platform participates in one continuous delivery architecture.

The permanent rules are:

- independently safe green changes activate immediately;
- unrelated changes are never accumulated into a release batch;
- repository changes use short-lived isolation and exact merge-SHA production evidence;
- `main` may move continuously and unrelated drift never triggers branch rebuild/replay merely to reach `behind_by=0`;
- non-Git platforms use platform-native atomic/versioned mutation, idempotency, read-back evidence and rollback/fallback rather than artificial Git branching;
- cross-platform contracts determine true dependencies;
- a red change blocks only itself and true dependents;
- all connected platforms must be registered in the Brain delivery inventory;
- BG167 provides shared current context, BG168 records material outcome/learning and BG169 remains production authority;
- GitHub, Netlify, Make, Notion, Supabase and DataForSEO are explicitly in scope, together with every other active or future Bedrijfsgeheugen integration;
- new chats, agents, scenarios and apps inherit this contract automatically through shared context, repository policy, onboarding gates and regression tests.

Canonical specs:
- `docs/superpowers/specs/2026-08-30-brain-continuous-cicd-v2-design.md`
- `docs/superpowers/specs/2026-08-30-brain-continuous-cicd-v2-1-all-apps-design.md`

Implementation plan:
- `docs/superpowers/plans/2026-08-30-brain-continuous-cicd-v2-1-all-apps.md`
