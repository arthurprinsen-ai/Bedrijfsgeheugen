# 2026-11-05 — original learning application, not another experiment scheduler

Production fact: 225 social experiments, 0 attributed applications in most original rows. At 08:38Z the original dated content and immutable publication records show one real LinkedIn company variant: **2026-11-03** artifact `generation_evidence.linkedin_loop.experiment_id=li-lus-co-20261030`, dimension `hook_type`, planned and actual value `concrete_number`, original decision provider reference `urn:li:share:7523338311717965825`, original publication obligation `LIVE_PROVEN` with independent `live_proven_at`, and original `social_posts` with same provider ID. Nov 1 and 2 generated variants **but never published**. Nov 4 and 5 published posts but had `SOURCE_UNAVAILABLE` original experiment source, so they cannot be assigned the variant.

Existing `powerhouse_runtime_scheduler_mux_v2` invokes `powerhouse_backfill_social_learning_applications_v1` at minute 39. Original implementation only joins `social_posts.learning_id` to `social_learnings`, which explains why a real published experimental variant is invisible.

### Exact existing-owner improvement
Preserve original lineage backfill, append a strongly gated second insert into the SAME `social_learning_applications`: original company artifact, channel decision and exact provider ID, canonical obligation LIVE_PROVEN, independently timestamped matched original organization post, existing experiment ID, actual `hook_type` equal to proposed dimension/value, one original-only per-post application identity. Negative/zero effect remains NULL and status **EXECUTED_PROVIDER_PROVEN_EFFECT_NOT_YET_MEASURED** until the original provider metric sync returns comparable snapshots. This is an actual application, not learning causal superiority.

No new executor, task, cron, connector, table, writer, campaign, paid model call, publish, human consent workaround or false green. The original hourly mux owns it. RLS remains unchanged and direct execution of SECURITY DEFINER is service_role-only.

### Proof gates
1. Protected Required, CodeQL, BRAIN and original migration preview.
2. Protected merge + native Supabase release of version `20261105093000`.
3. Original `pg_get_functiondef` source readback includes both original backfill and exact independent variant gates.
4. Next natural existing mux minute-39 execution creates **one** truthful Nov 3 application. Running it twice must not duplicate. No Nov 1/2 drafts may qualify.
5. Original social provider reader later independently observes real comparable 48h outcome and an appropriate control before turning applied into measured improvement. Until then, no unsupported uplift, customers, or revenue.

Methods are grounded in actual agent traces→feedback→evals→changes, and production metric monitoring: https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop and https://developers.google.com/machine-learning/crash-course/production-ml-systems/monitoring.
