# GA4 source-observed ≠ social-post-attributed — 12 November 2026

**Fingerprint:** `growth|ga4|observed-website-source-vs-social-post-attribution|20261112-v1`
**Owner:** existing `bg-analytics-sync-composio` / original ONE BRAIN Data Spine, handoff to existing Powerhouse SEO Order Engine and Heartbeat. No parallel scheduler, collection pipeline or synthetic visitors.

## Verified pre-change diagnosis
- In production `bg_ga4_sync` at 12:05 UTC: `status=ok`, 9 GA4 page rows, 0 updated post rows, 0 imported post measurements. This is not proof of zero website traffic.
- Independent GA4 via authorized Windsor connector: 37 channel-attributed sessions from 13 October to 11 November (18 direct, 7 Bing organic, 6 ChatGPT, 1 Google organic, 5 other). A second GA4 daily aggregation returned 36; reconcile the one-session discrepancy rather than invent a count.
- Existing `powerhouse_seo_keyword_intelligence_v1`: 15 records, freshest source at 25 October; no fresh keywords in the last seven days. Keyword freshness remains a **separate** open original SEO source obligation.
- The original GA4 collector intentionally imports to `bg-post-import` only records with exactly one known `social_posts.source_campaign_id`. Ordinary organic, referral and direct GA4 sessions lack such a campaign and must **not** be treated as successful attributed social-post metrics.

## Code correction (candidate, not deployed)
1. Separate `rows.length` (genuine provider observation), tagged `campaignRows`, untagged `sourceOnlyRows`, unlinked tagged campaigns, and actually imported post measurements.
2. Do not mark a source-only or ambiguous tagged campaign batch as fully `IMPORTED`. Keep batch `PARTIAL` with explicit source and attribution states; `bg_ga4_sync` is `partial`, not misleading `ok`.
3. Previous batch duplicate: positive full attribution is only recognized if original batch was `IMPORTED` **and** `rows_attributed > 0`. An existing empty batch cannot mint a new imported measurement by returning `ok` again.
4. Only **unmatched tagged campaigns** raise the existing CAS-guarded original ONE BRAIN repair; normal source-only organic/direct pages are evidence for acquisition but not a post attribution failure.

## Next mandatory original handoff
Original GA4 collector → durable original source batch and `bg_ga4_sync` exact run ID → existing GSC/GA4 acquisition owner and ONE BRAIN original obligation → actual SEO Order Engine consumer processed ACK → Heartbeat/Portal → production verified channel-qualified 7/14/28-day rolling acquisition and CTA/scan/lead/paid outcomes. First-party events remain consent-safe; neither bot hits nor on-platform likes are human website visits.

**Not proven:** this patch is not a new traffic collector, does not generate a visitor forecast, repair stale DataForSEO keywords by itself, attribute absent UTMs, publish any content, prove actual additional visitors, or complete downstream receipts. Require protected checks, merge, production function code verification, next natural run and independent consumer readback for any LIVE assertion.
