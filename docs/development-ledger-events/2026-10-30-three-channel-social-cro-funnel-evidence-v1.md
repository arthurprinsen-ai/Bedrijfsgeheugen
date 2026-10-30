# Three-channel social CRO evidence — 30 October 2026

## Independent production baseline
- Existing daily source collector read tenant `bedrijfsgeheugen` only, omitting `canonical/linkedin_personal` from unified read-only diagnostics.
- Latest snapshots: Instagram 144 `composio-instagram/OBSERVED` (30 Oct), LinkedIn personal 51 `composio-linkedin/OBSERVED_PARTIAL_SCOPE` (30 Oct), LinkedIn company 25 `windsor-linkedin-company/PROVIDER_OBSERVED_LINKED` (last 27 Oct).
- Brand social-learning evaluations: 13, newest 24 Oct; canonical evaluations last 19 Sep. Only one historically recorded canonical learning application; no proven continuous application on the next post.
- 48-hour provider-aligned samples on clearly owned posts in the last 60 days: Instagram 7, explicitly tagged company 0, explicitly tagged personal 4. An additional 15 LinkedIn samples belong to 58 legacy brand-tenant posts with NO_CHANNEL and must not be counted as company performance. This is NOT enough to conclude a current improvement on each channel.
- Seven-day CRO view: 4,347 human-flagged pageviews; zero observed CTA events. Zero commercial_leads and zero independently proven provider orders in 30 days. Pageviews are not users, attributed social traffic or orders.

## Fix inside the existing canonical workflow
- Extend existing read-only Content growth learning query to explicitly include canonical LinkedIn personal plus owned brand LinkedIn and Instagram, retaining tenant/channel separation.
- Capture the post's local NL publication day/hour and available topic/hook/format/CTA metadata; post-body quality is not verified by metadata alone.
- Compare only same-age independently sourced 48h ± 6h post snapshots, last 7 days vs prior 21 days. Minimum 5 valid post observations in each period **for every metric**; report INSUFFICIENT instead of invented increases. Distinguish views, impressions, reach, reactions, likes, comments, repost/shares, saves and clicks.
- Preserve independent permission and identity gates; do not claim identities of individual viewers or infer company affiliation. Public engager identity only where provider authorizes and lawful purpose permits.
- No second scheduler, publisher, platform fallback, automatically targeted DM, or confidence-threshold reduction. Existing hourly social evaluator and daily collector remain the owners.

## Outstanding proof obligations
1. Protected CI, merge, release and natural next daily collector readback must pass. A PR is not live proof.
2. Collect fresh provider observations in age-aligned windows for all channels. Personal LinkedIn reactions-only and provider report-date company metrics cannot be promoted to impressions or causal evidence.
3. Close decision -> applied learning ID -> real new post ID -> provider post metrics -> attributable website visit -> consented lead -> independent paid order. Unknown remains unknown.
4. Test hook/topic/CTA/format/day/hour one variable at a time with valid control and enough comparable observations; only promote verified commercial wins.
5. Connect the existing portaal metrics to the source-backed scorecard after the protected release and verify authenticated production browser readback.

Status: PR candidate only. No claim of rising KPIs, successful deploy, or closed commercial funnel.
