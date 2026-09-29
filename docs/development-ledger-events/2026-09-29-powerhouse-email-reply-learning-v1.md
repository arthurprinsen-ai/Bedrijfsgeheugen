# 2026-09-29 — Commercial email reply learning v1

Material change: closed the autonomous email commercial loop from provider send/readback through inbound reply, classification, suppression/follow-up, outcome and revenue-first learning.

Root cause: reply ingestion was not part of the canonical owner. A standalone server-side reply worker was initially attempted, but its Composio environment did not own the active Gmail connection, which proved that this would create a second execution authority. The route was removed.

Production verification: Gmail returned two real outreach replies. DID Telecom was classified as no-interest/self-recontact and suppressed. Tech Festival was classified as timing and received exactly one future nurture action. Learning refresh returned 2 replies / 2 objections for the relevant commitment-microstep variant. Parallel reply cron count is zero.

Permanent prevention: `sent` is not terminal, provider message ID is the reply idempotency key, suppression executes before outbound side effect, duplicate follow-ups are forbidden, revenue/order outcomes outrank reply volume, and strict cycle guards are never weakened to force later outcomes into an already closed action cycle.
