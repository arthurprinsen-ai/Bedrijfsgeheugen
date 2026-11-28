# Growth: classify traffic quality

**Date:** 28 October 2026. **Status:** candidate, not production-proven until migration is applied through the protected route.

`growth_events.is_robot` leaves most automated traffic unflagged. Of 1,183 attribution roots since 25 October, 555 are flagged, 24 behave like bots (8 or more views, no action), 601 are unverified single views and only 3 show a human action. GA4 reports about 19 sessions over 14 days, so raw page views overstate human visits by two orders of magnitude.

## Bounded implementation
- Two read-only views: `powerhouse_growth_traffic_quality_v1` (per attribution root) and `powerhouse_growth_traffic_quality_daily_v1` (per day and class).
- Invoker security; no access for `anon` or `authenticated`; `service_role` may select.
- No table, trigger, cron job or data change. Existing `growth_page_daily` and other consumers are not altered in this change.

## Independent validation
Static migration guard test. After merge: apply the migration by the protected route, register the version, then read the views as `service_role` and compare class counts with the pre-merge query in the PR description. Consumers (`growth_page_daily`, planners) are a separate step.
