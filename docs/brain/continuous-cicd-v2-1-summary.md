# BRAIN Continuous CI/CD v2.1 — Permanent Summary

Every current and future Bedrijfsgeheugen app, integration, agent, Make scenario and external platform is part of one continuous delivery architecture.

- Smallest independently safe green change releases immediately.
- Unrelated changes are never batched and never wait for each other.
- `main` may move continuously; unrelated drift never causes branch rebuild/replay/rebase.
- Reconcile only real file/contract/dependency conflicts or dedupe work already landed.
- Repository changes use exact candidate/merge/deploy identities.
- Non-Git apps use platform-native atomic/versioned mutation plus exact read-back/outcome evidence.
- A red change blocks only itself and true dependents.
- BG167 = shared current context; BG168 = material outcome/learning; BG169 = production authority; BG166 = error/history ledger.
- All registered platforms inherit the contract. The live registry includes GitHub, Netlify, Make, Notion, Supabase, DataForSEO and additional connected services.
- Targets: unrelated wait caused by unrelated work = 0; branch rebuilds caused solely by unrelated main drift = 0.

Canonical policy: `config/brain-continuous-promotion-v2-1.json`.
Canonical design: `docs/superpowers/specs/2026-08-30-brain-continuous-cicd-v2-1-all-apps-design.md`.
