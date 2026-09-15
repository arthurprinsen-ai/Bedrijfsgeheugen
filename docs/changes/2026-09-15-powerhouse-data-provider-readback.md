# Powerhouse data provider readback — 2026-09-15

Contract: `powerhouse-data-intake-learning-spine-v1`

## Verified source state

- GA4 property `546874601` / `Bedrijfsgeheugen` is connected and returns genuine data through the existing Windsor.ai connection.
- Fresh readback over the last seven days returned sessions/users/page views for 2026-09-09, 2026-09-11, 2026-09-12 and 2026-09-15.
- Thirty-day GA4 channel readback distinguishes Direct, Organic Search, Referral and AI Assistant traffic. No Email channel was observed in that readback.
- The canonical Supabase collector remains fail-closed because the Google service account receives `GA4_403: User does not have sufficient permissions for this property` on property `546874601`.
- Windsor.ai can target Supabase as a scheduled export destination, but no Supabase destination credential is connected and Windsor marks this destination `create_in_chat=false`. Therefore no unverified parallel export was created.
- Email/newsletter attribution can be observed through GA4/UTM once tagged traffic exists, but campaign delivery/open/click analytics remain `BLOCKED_HARD_BOUNDARY` until a real campaign provider/account is connected.

## Canonical decision

1. Do not weaken GA4 authentication and do not synthesize analytics.
2. Keep the direct Google Analytics Data API collector as the canonical Supabase ingest route.
3. Treat Windsor.ai as verified source/readback fallback, not as a second analytics store.
4. A future Windsor→Supabase fallback may only write into the existing canonical GA4 ingest contract/tables and must use a user-authorized Supabase destination credential.
5. Keep GA4 canonical ingest red until `bg_ga4_sync` has a successful production run with stored rows/readback.
6. Keep email campaign analytics red until a campaign provider is connected and real sends/opens/clicks/outcomes are read back.

## Hard boundaries

- `ga4-property-permission-546874601`: Google Analytics property permission for the Supabase service account.
- `email-campaign-provider-connection`: campaign/newsletter provider account connection.
- `windsor-supabase-destination-credential`: only needed if Windsor is deliberately promoted as a fallback ingestion transport; do not create a parallel store.

These are persistent open obligations under `whole-brain-outcome-obligations`; credentials/account connections and permissions are explicitly hard boundaries. They must be rechecked by future agents rather than silently treated as healthy.
