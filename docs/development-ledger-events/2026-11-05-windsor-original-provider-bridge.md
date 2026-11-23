# 2026-11-05 — original Windsor provider-schema repair

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Owner: existing `bg-social-metrics-sync` and original Growth & Revenue OS external metric source.
- Live observation: 55 native Windsor staging rows / zero provider-verified company metric links; stale since 2026-11-01; existing 6h cron #177 succeeds but no company metrics progress.
- Proven root: native metadata `source=linkedin_organic,provider=windsor.ai,account,post_id,share_id,share_url` vs linked-company-analytics fixture-only `source=windsor.ai,provider=linkedin,connector,scope,provider_post_urn`; `metrics.post_id` also absent on real source.
- Actual connected provider independently returns 4 impressions Nov3 and 5 impressions Nov4, exact account and post IDs; no inferred visits or revenue.
- Correction: exact native metadata accepted only with strict original author+provider proof and same-freshness policy, no new scheduler or social publish.
- Tests: `tests/brain-windsor-native-learning-provider-repair-20261105.test.mjs`, existing strict legacy suite.
- Machine learning: `brain/learning/2026-11-05-windsor-native-company-metric-contract-v1.json`.
- Productive closure: protected Required/CodeQL/BRAIN, merge, original active Edge byte parity, fresh source provider observation, natural original cron #177 linked snapshot and true noncausal experiment-effect status.
- Unresolved: Windsor source refresh to Supabase source store, legitimate experiment denominator and actual downstream business outcome. Never mark complete without proof.
