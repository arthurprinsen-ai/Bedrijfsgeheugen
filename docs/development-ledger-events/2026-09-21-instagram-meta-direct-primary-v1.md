# Development ledger — instagram-meta-direct-primary-v1

- Date: 2026-09-21
- Problem: Instagram publishing used intermediary transports, adding avoidable external failure modes.
- Fix: the official Meta Instagram API becomes the primary transport inside the existing canonical social publisher.
- Safety: Mira-only proof, exact-final-media SHA, atomic claim, one-time publication capability, dedupe and provider readback remain mandatory.
- Recovery: after Meta returns a media id, that exact object is reconciled; uncertain readback never authorizes a duplicate publish.
- Configuration: direct Meta setup is validated server-side through the authenticated admin boundary.
- Fallback: Composio remains bounded secondary transport and Buffer bounded final fallback.
- Production closure: merge, migration/function deployment and runtime readback are required before terminal success.
