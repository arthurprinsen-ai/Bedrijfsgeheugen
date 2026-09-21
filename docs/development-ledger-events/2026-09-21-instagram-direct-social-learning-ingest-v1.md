# 2026-09-21 — Instagram direct social-learning closure

- Fingerprint: `instagram-direct-social-learning-ingest-v1`
- Root cause: direct Composio Instagram publication bypassed `social_posts`; Buffer was the only ingest bridge.
- Change: canonical publisher performs provider-truth-gated idempotent social ingest and learning refresh.
- Winner lineage: `powerhouse_instagram_daily_winners_v1.recommendation_id` and `score_version` are copied into `social_posts`.
- Recovery evidence: `powerhouse-content-closed-loop-v1` is active every five minutes, so Buffer cooldown exit is already autonomously retried without adding a second scheduler.
- Forbidden: Make, duplicate writer, second winner, regeneration to escape transport state, or declaring terminal before production readback.
