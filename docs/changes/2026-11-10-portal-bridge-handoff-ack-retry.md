# P0 #4215 — Original portal runtime-to-BRAIN handoff must not disappear before ACK

Original owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215

## Verified source gap
Existing `portal-v2/powerhouse-runtime-bridge.js` queue removed events on the debounce timeout **before** calling `/api/brain-operating-loop`. A failed provider POST returned null or threw and the error was caught; the item was already gone. Even a successful HTTP 2xx without a matching `record.id` was treated as a success by callers. Asynchronous queued events had no strict original identity binding; old correlation could influence the next user's requested action.

## Bounded change to the ORIGINAL bridge
- Construct the exact Evidence/Action message on the first event, including stable ID, source correlation, timestamp, payload and idempotency key.
- A pending item is deleted **only** when the original Brain HTTP response contains the same `record.id` and `record.correlationId`. Transport errors, HTTP failures, malformed and mismatched 2xx are not ACKs.
- Reuse only the current 45-second runtime refresh, focus and auth-subscription lifecycle to retry ready failed items. In-flight guard prevents simultaneous duplicate sending.
- Check exact authenticated subject before token acquisition, POST and receipt processing. Identity change drops the previous account's transient queue and correlation; no second tenant receives a prior tenant's data.
- Use `pendingHandoffs()` to inspect only count and count ready but not acknowledged, without revealing the payload.

## Limitation and evidence gate
This is **session-only** resilience. The existing customer BusinessInput path and persisted Brain store remain the authoritative server. There is no browser-restart-durable action outbox for pending interaction evidence yet, so P0 #4215 stays OPEN. Never declare a complete customer outcome from a queued event, ACK, new deployment or a source-level test.

Acceptance: focused regressions for 503/offline, incomplete ACK, duplicate and tenant switch; original protected Required/CodeQL, current Netlify exact-SHA confirmation and signed-in two-tenant readback. The original input -> BRAIN -> Powerhouse -> Heartbeat -> decision/action -> provider execution -> verified outcome -> learning proof is separately EVIDENCE_DUE.
