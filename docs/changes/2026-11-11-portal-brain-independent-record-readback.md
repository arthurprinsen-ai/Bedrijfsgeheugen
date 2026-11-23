# P0 #4215 — exact receiver GET must acknowledge original Portal runtime Brain record

Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Obligation-ID: portal|v2|brain-operation-post-to-get-exact-record-receipt|20261111-v1
Delivery-Lane: portal
Candidate-Type: recovery
Base-SHA: 1e012ab3ab0be14fdf13d64c11af4688c411800c
Writer-Lease-Owner: original Portal V2 / original ONE BRAIN operating loop
Writer-Lease-NonOwner-Action: HOLD

## Verified source-level gap
Original `portal-v2/powerhouse-runtime-bridge.js` only required the original `POST /api/brain-operating-loop` response to echo `record.id` and `correlationId` before deleting the pending entry. It called the existing `refresh()` afterwards, but a generic runtime projection was not checked to contain that particular immutable record. Thus a request could return an exact producer echo without the record becoming independently retrievable in its original authorized tenant. This is a real handshake weakness; a successful UI refresh alone does not prove receiver/read-model adoption.

## Change in one existing authority
- After exact POST echo, issue a read-only, authenticated `GET /api/brain-operating-loop` using the original same-session bearer and no-store cache.
- Verify `projection.records` contains the **identical** `record.id`, `correlationId`, `type`, `observedAt`, `provenance.source='portal-v2'`. Server endpoint already uses authenticated tenant resolution and object-access filtering; no new API, DB, table, scheduler, worker, provider or service-role.
- If GET is missing/not authorized/not current/record mismatched, **do not** set completion or remove the original pending record; keep its original immutable ID/body/idempotencyKey and let the existing 45-second/focus/identity refresh safely retry. Original session and trusted tenant membership checks remain mandatory.
- On exact independent GET confirmation only, remove the matched original pending entry and refresh existing Portal runtime projection. This proves canonical store visibility, **not** Action EXECUTED, Heartbeat consumption, value or commercial outcome.
- Source owns original append idempotency contract. The normalized Brain record does not expose `idempotencyKey` in its GET projection, so readback compares the other server-retained immutable attributes plus original provenance. Do not invent a missing idempotency field.

## Regression and original safety gates
- `portal-v2/tests/powerhouse-runtime-bridge.test.mjs`: existing successful mocks now simulate two distinct POST and GET surfaces; negative test ensures POST ACK with invisible GET record stays pending until exact readback; foreign ID, wrong source and wrong correlation fail closed.
- `tests/brain-portal-runtime-bridge-handshake-no-loss-20261111.test.mjs`: original same-user A→B isolation, safe idempotent retry, and mandatory source inspection.
- Follow same protected Required/BRAIN/CodeQL + original System Map, no false green, exact source main merge + Netlify published SHA + original production browser acceptance.
- Original global issue #4215 stays OPEN for real two-tenant authenticated customer write/readback, downstream Powerhouse/Heartbeat consumers and durable unsent generic UI events after tab/browser close. The original content/email/learning obligations remain with their separate original owners. PR #5557 already owns original Supabase 819 provider ledger repair, out of scope here; never change it concurrently.
