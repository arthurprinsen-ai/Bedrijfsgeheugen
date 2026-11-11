# P0 #4215 — original Portal runtime handshake no-loss/tenant boundary

Obligation-ID: portal|v2|runtime-bridge-unacked-overwrite-and-same-user-tenant|20261111-v1
Owner: original Portal V2 and original ONE BRAIN runtime bridge, https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Base-SHA: 169cfc9b6aed47e73bcdfc2da091a68cbdb9759f
Delivery-Lane: portal
Candidate-Type: recovery
Writer-Lease-Owner: original Portal V2 #4215
Writer-Lease-NonOwner-Action: HOLD

## Observed original structural bugs
The source-level `portal-v2/powerhouse-runtime-bridge.js` used one stable Map key per interaction category such as `semantic-point`, `future-lens` and `context-inspector`. When a prior ready/in-flight record received no matching Brain ACK (provider 503/timeout/partial 200), the next interaction of that category replaced its Map entry. The first original immutable record was then **lost**, not retried. UI debouncing had mistakenly overwritten genuine delivery obligations.

The bridge principal only used `snap.user.id`, whereas the existing durable Portal domain journal already binds both user and tenant membership. A person switching companies while retaining the same login ID could retain an earlier company's queued Brain action/evidence and correlation and attempt to send it under the newly issued company token. Identity must include the trusted server-issued tenant membership, not user-editable profile metadata.

## Source-level repair inside original runtime bridge
- Debounce only a **not ready** transient UI event. A ready/in-flight/failed ACK record remains in the original Map, with its original immutable `id`, `idempotencyKey`, `observedAt`, correlation and predecessor IDs. Any distinct following event gets a separate Map key and its own ACK requirement.
- De-duplicate exact repeated `idempotencyKey` within the same principal without creating a competing in-flight POST.
- Existing `/api/brain-operating-loop` requires body.record.id and body.record.correlationId to match the submitted immutable record before deletion. Retain automatic replay only on the original 45-second/focus/identity refresh. Nothing retries after logout under another tenant.
- `principalFromSnapshot` now includes `user.id` plus trusted `app_metadata.tenantId` (and existing `appMetadata.tenantId` compatibility). On true tenant switch old queued items and last correlations are invalidated before the next request.
- No new database, table, queue, scheduler, task, provider, social publisher, mail sender or extra Brain writer. Only the already mounted original runtime bridge and tests/skills were edited.

## Verification and evidence stages
- `portal-v2/tests/powerhouse-runtime-bridge.test.mjs`: same event type after failed 503 preserves both original messages and retries without changing IDs; same user switching company drops A pending before B bearer POST; exact repeated sourceRevision does not duplicate ACK.
- `tests/brain-portal-runtime-bridge-handshake-no-loss-20261111.test.mjs`: cross-tenant source/ACK regression, original journal remains owner.
- Protected Required/CodeQL/BRAIN and generated system map parity, exact protected merge and Netlify READY source readback, followed by same-release 17-case browser acceptance. No UI handoff may count as completed simply because the website deployed.

## Residual non-silent obligations
This patch prevents **same-session** evidence overwrite. Unsent runtime UI events remain in memory, and an abrupt tab close before server acceptance is **NOT server durable**. Customer BusinessInput uses the already existing original server journal, but this does not make generic UI action intentions durable after browser termination. Full two-tenant authenticated Portal→Brain→Powerhouse→Heartbeat consumer ACK, actual executed action, measured customer outcome and autonomous learning remain EVIDENCE_DUE under original issue #4215.

The existing native 15-minute/ONE BRAIN content chain already has its own separate obligation audit; live 2026-11-11 counts showed 432 OPEN CONTENT_HANDOFF rows, including 193 overdue publications and 179 original social learning source rows awaiting independent proof. Do not auto-close, resend an ambiguous provider side effect, bypass provider consent, misreport 0 measurements, or introduce a new executor to manipulate counts. Continue original owned retry and owner/incident tracking.
