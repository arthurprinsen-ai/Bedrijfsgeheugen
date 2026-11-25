# 2026-11-05 — Real provider data stops at an incompatible learning adapter

Original Powerhouse / ONE BRAIN #4198. Production 5 Nov 06:18 UTC `bg-social-metrics-sync` was scheduled and successfully processed personal reactions, but company analytics returned `NO_EXACT_INDEPENDENTLY_LINKABLE_ANALYTICS` with **55** source observations, **0** linked. The original staging source had been stale since **2026-11-01**.

Root cause verified by native schema: existing `powerhouse_growth_source_daily_v1` rows use `evidence: {source:'linkedin_organic', provider:'windsor.ai', account:'18234216',post_id:'urn:li:share:...',share_id:'...',share_url:'...',provider_metric_date:'...'}`. The existing `linked-company-analytics.mjs` expects a different normalized fixture format and `metrics.post_id` that the real provider staging NEVER supplied. The result was silently zero even with correct author/post IDs.

The existing connected Windsor `linkedin_organic` provider confirms new impressions, directly observed on 5 November:
- Nov 3 LinkedIn company share `urn:li:share:7523338311717965825`: **4** impressions, 0 likes, 0 comments, 0 clicks.
- Nov 4 LinkedIn company share `urn:li:share:7523640497140027392`: **5** impressions, 0 likes, 0 comments, 0 clicks.
Both shares are separately `LIVE_PROVEN` in original publication obligations and exact `urn:li:organization:18234216` author readback. This is verified **provider exposure**, not leads, causal uplift or revenue.

Safe same-owner repair: original `supabase/functions/_shared/linked-company-analytics.mjs` accepts exactly one of TWO explicit source schemas (original canonical normalized fixture or authentic existing native Windsor staging). Native requires aligned original source key, share ID, HTTPS share URL, date, company account, exact source tenant, independently verified original author and post, fresh provider-observed timestamp, and nonnegative numeric metrics. No wildcard provider/source fallback. Existing `bg-social-metrics-sync` six-hour cron #177, source staging table and social snapshot table remain the only integration. No extra scheduler, writer, reauthorization, publishing or fake experiments.

Note: real source rows are currently STALE; schema repair alone does not create fresh observations. Autonomous refresh through the existing connected original Growth & Revenue task/authorized source remains a separate requirement, with natural original provider sync and independent readback. Old stale metrics must remain rejected. Success metric is fresh exact-provider `social_metric_snapshots` linked to the genuine experiment application plus later honest measured effect.

References: [OpenAI agent evaluation](https://developers.openai.com/api/docs/guides/agent-evals), [Google ML feedback rules](https://developers.google.com/machine-learning/guides/rules-of-ml).