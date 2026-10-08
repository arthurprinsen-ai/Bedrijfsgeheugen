# Development ledger — governed predictive credit failover

- Date: 2026-10-08
- Obligation-ID: powerhouse-governed-predictive-credit-failover-20261008-v1
- Existing authority: Supabase ONE BRAIN AI governance registry and existing Composio/Groq proxy; no additional scheduler/store/agent.
- Verified production trigger: 2026-10-08 15:00:35 UTC predictive-run health `fout`, Anthropic provider HTTP 400 insufficient credits; actual deployment had already repaired the error receipt in PR #4177.
- Canonical provider precedent: approved ACTIVE model `openai/gpt-oss-120b` for exact predictive fallback use case; prior 2026-10-07 runtime success included Composio/Groq provider evidence.
- Change: restricted recoverable-error routing with strict approval/model check, one bounded provider request, schema and existing forecast-source checks, provider provenance in existing health writeback.
- Changed files: `supabase/functions/_shared/predictive-governed-fallback.mjs`, `supabase/functions/powerhouse-predictive-engine/index.ts`, `tests/brain-predictive-governed-fallback-v1.test.mjs`, `brain/learning/2026-10-08-governed-predictive-credit-failover-v1.json`, `docs/changes/2026-10-08-governed-predictive-credit-failover-v1.md`, this append-only ledger.
- Guardrails: never reroute authorization/governance rejection, never invent provider acknowledgments or revenue, do not bypass protected GitHub checks, no hardcoded credentials.
- Status at authoring: candidate NOT production verified; protected merge, Edge hash/source readback and fresh `bg_gezondheid` predictive outcome required.
