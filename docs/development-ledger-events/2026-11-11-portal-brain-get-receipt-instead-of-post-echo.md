# 2026-11-11 — Portal→ONE BRAIN exact two-phase record handshake

Original owner: Portal V2 #4215
Obligation-ID: portal|v2|brain-operation-post-to-get-exact-record-receipt|20261111-v1
Base-SHA: 1e012ab3ab0be14fdf13d64c11af4688c411800c
Delivery-Lane: portal
State: CODE_CANDIDATE pending protected CI, exact production deployment and independent readback.
Evidence: source `portal-v2/powerhouse-runtime-bridge.js`; server `platform/api/brain-operating-loop-handler.mjs`; server canonical `brain/operating-loop/store.mjs`. The original server GET projection returns `records` filtered by original tenant and object access.

## Original cause
Producer HTTP 200/201 POST echo with matching ID/correlation could remove the in-memory pending portal item after a generic `refresh()`. That refresh previously did not prove the exact submitted immutable record was independently retrievable. A wrong tenant, stale projection or delayed provider record could therefore look delivered without actual readback. This is not a claim that a particular production customer lost a record; the path was source-level vulnerable.

## Repair and prevention
Require a second read-only authenticated original GET and exact original record identity/type/observedAt/source. Keep pending on failure; original 45-second/focus/identity retry with original immutable ID. Server already owns tenant authorization and idempotency. Preserve no-data-after-principal-switch and no duplicate source replays. This is one original chain with producer and receiver handshakes, not a new polling loop or outbox.

Regressions: `portal-v2/tests/powerhouse-runtime-bridge.test.mjs`, `tests/brain-portal-runtime-bridge-handshake-no-loss-20261111.test.mjs`. Documentation/skill: existing `portal-living-interface` and `powerhouse-continuity` updated. No additional scheduler, SQL migration, social or email send.

## Remaining EVIDENCE_DUE
Unsaved or unsent local UI intents when the browser closes, actual independent two-tenant customer source-to-Heartbeat-ack, 7 red original Heartbeat loops and original CONTENT_HANDOFF obligations remain unproven. PR #5600 live protected main SHA 1e012ab3ab0be14fdf13d64c11af4688c411800c/Netlify 6af41c295e090b1a009b649b; original production DOM readback run 42981334629 succeeded. Original BRAIN delivery backend lane failed unrelated original 819 migration history tests; separate owner PR #5557 holds that lock repair and must not be bypassed.
