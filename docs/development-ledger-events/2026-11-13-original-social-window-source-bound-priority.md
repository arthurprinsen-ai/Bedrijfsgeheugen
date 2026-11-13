# P0 #4198 — social-learning original priority source binding

- Date: 2026-11-13
- Original owner: existing ONE BRAIN `social-learning-store` and hourly `social-learning-evaluate`, existing six-hour provider observer #177
- Incident fingerprint: `powerhouse|social-learning|hourly-window-priority-not-original-provider-bound|20261113-v1`
- Source evidence: original production read-only join of `social_learning_obligations`, `social_posts`, `social_metric_snapshots`: 184 open social-learning, 143 partial, 36 missed, 5 other. 81 partial records had numeric impressions from any time, but zero exact, provider-qualified 24/48/72h ±6h observations; 7 raw observed-at-close records were partial-only. Existing source #177 cron active every six hours, original hourly evaluator remains independent.
- Root cause: original priority index missed the tenant and provider source_event identity binding and let a caller request ±12h while downstream ACK correctly required ±6h. Invalid partial/unbound sources could consume scarce evaluation slots; no evidence they caused the whole historical backlog.
- Remediation: original shared priority selector now source-event-bound and tolerance <=6; existing Edge query returns tenant for same records; preserve 900-row fail-closed truncation and original hourly tenant isolation. No new scheduler, provider calls, role grant, fabricated historical window or replay of published posts.
- Regression: `tests/brain-social-learning-observed-window-priority-v1.test.mjs` includes exact tenant/provider source event, wrong provider, wrong post, wrong tenant, null metrics, partial quality, six-hour edge and no override beyond six hours.
- Workflow: protected PR Required/CodeQL/Supabase Edge preview then independently proven production Edge deploy and natural original consumer readback. No close/green for 184 pending genuine evidence. Source learning in `brain/learning/2026-11-13-original-social-window-source-bound-priority-v1.json`.
