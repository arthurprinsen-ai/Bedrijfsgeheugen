# 12 november 2026 — Blog live-proof is Netlify + public HTTP, not social external_id

The existing original #171 Powerhouse publisher / ONE BRAIN handoff requires a first-party blog to carry a *social* `external_id` before it can transition from `OVERDUE_PUBLICATION`. This is wrong for blogs. Production source: 2026-10-25 blog was originally `MEASURED`, has `live_proven_at`, first-party HTTPS `canonical_url`, `evidence.public_http_status='200'` and `evidence.netlify_deploy_id='6addd26df8c80a10be5828d9'`, but has `external_id=NULL`. Original BRAIN falsely called this `OVERDUE_PUBLICATION`.

## Exact, channel-specific evidence gate

- Blog: first-party `https://www.bedrijfsgeheugen.nl/blog/...`, original live timestamp, status in LIVE_PROVEN/MEASURED/LEARNED, HTTP=200 and immutable Netlify deploy ID. No social `external_id` required.
- Instagram, LinkedIn personal and company: continue demanding exact external post ID, original provider truth flag, original live timestamp, HTTPS permalink and valid publication state.
- Missing GA4/GSC, social metrics, corresponding original BRAIN analysis, future post readback, causal lift or revenue remains missing. **Never close entire CONTENT_HANDOFF based on public HTTP alone.**
- Same original `powerhouse_content_handoff_receipts_v1`, same cron #171; no second provider, scheduler, publication or backdated synthetic metric.

Regression: `tests/brain-original-blog-netlify-provider-proof-20261112.test.mjs`. Verify protected Required/CodeQL, original Supabase migration application, exact production function SQL, original BRAIN stage replay and leave measurement obligations overdue until original provider evidence returns.
