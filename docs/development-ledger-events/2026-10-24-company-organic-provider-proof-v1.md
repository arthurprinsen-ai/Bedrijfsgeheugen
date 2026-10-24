# Strict Windsor organic LinkedIn → proven brand social post measurement bridge (24 Oct 2026)

Observed: Windsor LinkedIn organic connector account 18234216 identifies Bedrijfsgeheugen; canonical Composio LIVE_PROVEN LinkedIn company publication author URN is `urn:li:organization:18234216` and independent published post ID exactly matches registered brand social post IDs. Of seven provider source observations, five meet three-way identity+truth constraints and two do not. Original upstream source row correctly remains `PROVIDER_OBSERVED_UNLINKED` until matched by this independent bridge.

Change: in the **existing** 6-hour `bg-social-metrics-sync`, perform a bounded, idempotent extra read of owned organic source observations and exact canonical publication proof and brand posts. Only triple verified matches create `social_metric_snapshots` with `OBSERVED_PARTIAL_SCOPE`, provider report date, provider observation timestamp and actual metrics. No 24/48/72h cause-or-lift claim because provider report date differs from readback date. The existing daily diagnostics can use impressions independently from views.

No republish, no new scheduler, no invented sales, no leaked person data, no Buffer fallback, no changing publication statuses. Tests fail closed for missing owner, account identity, author, metrics and official readback.
