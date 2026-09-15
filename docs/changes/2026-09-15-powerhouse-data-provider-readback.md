# Powerhouse data provider readback — 2026-09-15

Contract: `powerhouse-data-intake-learning-spine-v1`

## Canonical provider state

- **Buffer is the canonical social-performance provider** for LinkedIn/Instagram publication and performance readback into the existing social metric / learning chain.
- **Composio is the canonical external/app provider layer** where the Powerhouse uses connected application data. Windsor.ai is **not** part of the canonical Powerhouse provider architecture and must not be promoted into it from diagnostic readback.
- **Gmail is connected and active**. Gmail is therefore a live Powerhouse channel for outbound email, replies, sent-message readback and commercial follow-up evidence.
- Gmail message-level outcomes (sent/replied/thread/message-id and follow-up state) belong in the existing growth/revenue/sales outcome lineage.
- Newsletter/campaign analytics such as opens, unique clicks and unsubscribes are a separate capability from Gmail message delivery. They remain unavailable unless a campaign/newsletter provider with those metrics is connected.

## Canonical decision

1. Buffer remains the single social publication/performance source; do not introduce Windsor or another parallel social analytics source.
2. Composio remains the provider/integration route for connected external application data where already used by Powerhouse.
3. Gmail is classified as `LIVE` for outbound/reply/readback and must feed the existing sales/outcome/revenue-learning lineage.
4. Do not mark all email as blocked. Only newsletter/campaign-specific analytics remain blocked when no such provider exists.
5. Windsor.ai diagnostic reads are non-canonical and create no Powerhouse obligation, ingestion path or datastore.
6. Preserve fail-closed provider health: a connected provider is green only when current readback succeeds and downstream evidence is stored.

## Provider ownership

- Social publishing/performance: `Buffer`.
- External/app integration layer: `Composio`.
- Email send/reply/readback: `Gmail`.
- Newsletter campaign opens/clicks/unsubscribes: `BLOCKED_HARD_BOUNDARY` until a dedicated campaign provider is connected.

## Hard boundaries

- `newsletter-campaign-analytics-provider`: only applies to campaign-level metrics not supplied by Gmail.
- Any future provider permission/account failure must be registered independently; it must not cause already connected Buffer, Composio or Gmail capabilities to be marked blocked.

This correction is persistent Powerhouse state. Future agents must reuse these provider roles and may not substitute Windsor.ai or another parallel integration route without an explicit canonical architecture change.
