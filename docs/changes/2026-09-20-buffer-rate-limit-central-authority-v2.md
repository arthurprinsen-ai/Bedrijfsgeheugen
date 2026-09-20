# Buffer 429 circuit breaker on central publication authority — 2026-09-20

Fingerprint: `buffer-rate-limit-central-authority-v2`.

Buffer rate limits are now treated as persistent provider state rather than a transient exception to hammer again on the next run. The publisher stores a bounded retry timestamp in canonical delivery evidence and suppresses LinkedIn Buffer polling until that time.

When Buffer acknowledges a create, the provider post id is persisted before readback. If the immediate readback is rate-limited, Powerhouse keeps that external identity and defers verification instead of creating a replacement. This preserves idempotency across retries.

The change is layered on top of the central social publication authority. Instagram direct Composio publication remains governed by the Mira exact-final-media gate and is not routed through Buffer merely because LinkedIn is cooling down.
