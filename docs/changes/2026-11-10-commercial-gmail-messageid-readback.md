# 2026-11-10 — Gmail readback camelCase provider contract repair

Observed original commercial action waiting after real Gmail send: native Gmail and Composio both found the exact message `1a1c4b1f339a051f` (SENT label, exact recipient and thread), but original sender incorrectly read only `id/message_id` while Composio actual response used `messageId`. This is **readback schema drift**, not a send failure, and MUST NOT cause another send.

**Repair within original executor**: shared `verifiedGmailReadback` requires exact message ID, SENT label and recipient with real provider response wrapper. The original `powerhouse-autonomous-outreach` has an authenticated `readback_only` path which processes solely already-claimed `waiting/needs_readback` actions, and returns before composer or any new delivery. No alternate mail sender, queue, scheduler, unsuppression or provider re-send. Historical replay, shadow and canary regression are mandatory. Source code in PR; not live until protected merge + original Edge deploy/readback.

**Proof**: same original action ID and provider ID, in Gmail SENT, no second send, original action `done`, original `powerhouse_sales_outcomes(sent)` idempotent, BRAIN and Heartbeat real outcome consumer. An accepted provider ID by itself is not yet terminal until independent verification. Reply, meeting, experiment and revenue are separately verified, not inferred.

Original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
