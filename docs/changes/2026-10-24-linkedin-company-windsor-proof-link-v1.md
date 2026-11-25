# Exact LinkedIn company analytics linkage without making up impressions

The existing independently published company posts are already registered in `social_posts`. Windsor.ai `linkedin_organic` provides post-specific `share_impression_count`, `share_clicks_count`, `share_comment_count`, etc. Earlier provider ingestion correctly withheld these values as `PROVIDER_OBSERVED_UNLINKED` because it could not establish the business account. Canonical `LIVE_PROVEN` publisher evidence now independently includes `author_urn`, a provider-readback `linkedin_readback.author` and exact provider share URN. These can be compared with Windsor's organization account id.

This update reuses the **existing six-hour** `bg-social-metrics-sync` Edge function and the **existing** `social_metric_snapshots` table. Only matching company ownership and exact verified post IDs permit a bounded, idempotent metric snapshot. The staging record stays immutable. No new scheduler, permission, analytics poller, personal identity combination or publication mechanism is added.

`impressions` are a real provider metric but are not reach, video views, qualified leads or customers. A test needs 2 distinct matured company posts each with >=50 impression exposure and >=200 cumulative impression exposure before it can influence the next commercial post. Lower samples remain unknown/insufficient. This repair does not claim a creative winner, conversion lift or realized revenue without independent canonical business outcomes.

Validated with `tests/brain-linkedin-company-windsor-proof-link-v1.test.mjs`. Completion requires protected Required/CodeQL, exact GitHub merge, Supabase Edge release and genuine provider metric readback.
