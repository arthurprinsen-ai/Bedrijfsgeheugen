# Original ONE BRAIN handoff — Windsor source partial-read safety

- Date: 2026-11-15.
- Original root incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Original owner: existing #177 `bg-social-metrics-sync`, dependent same hourly social-learning evaluator and original #171 ONE BRAIN consumer.
- Independent live root: original pg_cron 177 dispatch succeeded; original Edge provenance `WINDSOR_PROVIDER_HTTP_403` and `WINDSOR_STALE`. Connected Windsor.ai delegated app can read 12 original LinkedIn company posts and account metrics on the same organization, but that does not grant the Supabase Vault key permission or production writer ownership.
- Observed source-loss risk: `Promise.all(postResource, accountResource)` rejects both if optional account resource is denied. Source-bound recovery in same original Edge isolates an optional account failure and stages only original LIVE_PROVEN, exact organization authored post rows; preserves original ID, account, immutable observed timestamp and original source/readback guard.
- Closure guard: Any missing account proof triggers original `ORIGINAL_COMPANY_SOURCE_REFRESH_UNAVAILABLE` with safe failure class and original ONE BRAIN occurrence. Mandatory post API failure remains an error. Full-loop provider health remains RED; no causal uplift, no fake social-window ACK, no alternate provider writer.
- Regression test: `tests/brain-original-windsor-company-source-177-20261114.test.mjs`, source-authority tests remain unchanged. Skill: `.agents/skills/powerhouse-social-cro-funnel/SKILL.md`.
- Next action: Original #177 owner verifies Vault key account/resource scope and original Edge version after protected release; original actual provider source POST/ACCOUNT read, verified stage/readback, #171 exact ACK and measured outcomes must be independently observed. A 403 across both resources remains credential-gated; do not claim the patch cured it.
- Release evidence status: pending protected exact-head checks, protected merge and Supabase Edge release/readback at PR creation; P0 remains OPEN. No second cron, sender, worker, connection, token write, bulkclose or duplicate reconciliation path.
