# 2026-11-11 — fix duplicate-key overwrite and tenant-crossing UI runtime handoff

Original issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Fingerprint: portal|v2|runtime-bridge-unacked-overwrite-and-same-user-tenant|20261111-v1
Base-SHA: 169cfc9b6aed47e73bcdfc2da091a68cbdb9759f
Owner: original Portal V2 + Powerhouse runtime bridge
Delivery-Lane: portal
State: SOURCE_CANDIDATE; exact protected production readback not yet performed

Observed root cause: `queueEvidence` replaced an already-ready or in-flight `pending` Map record using its shared UI event key (semantic-point etc.), losing the earlier failed/unverified record and allowing its unmatched external side effect to go unacknowledged. Also `principalFromSnapshot` used only login user ID rather than identity plus server-issued app tenant membership.

Repair: Only debounce unsent transient events; protect the previous ready or in-flight immutable handoff and give later distinct events unique message keys; collapse exact idempotent duplicate signal. Bind pending record to login+app tenant membership and revoke all old messages, correlations and original inflight attempts on business change. Preserve fail-closed HTTP ACK matching; original refresh (45 seconds/focus/identity) remains sole retry clock. Original customer state journal is untouched.

Regression: `portal-v2/tests/powerhouse-runtime-bridge.test.mjs`, `tests/brain-portal-runtime-bridge-handshake-no-loss-20261111.test.mjs`. Skill update: Portal Living Interface and Powerhouse Continuity. Prevention: every future related event must retain an unacknowledged predecessor; no old tenant provider message under new bearer; no duplicate exact idempotency key.

Release: protected exact-head Required/BRAIN/CodeQL; original system-map regeneration; protected main merge; Netlify source-exact published SHA; original production DOM browser readback; independently evidenced tenant/provider/consumer outcome before marking higher levels proven. The browser UI runtime queue is still in memory and is not proof of a server-durable closed-tab UI-action outbox. The complete 432 historical OPEN content handoffs are separate existing original owner obligations; do not declare global one-loop green from this local repair.
