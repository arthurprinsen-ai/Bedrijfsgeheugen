# P0 #4215 — isolate demo-only input from canonical Brain handoff

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Prior source: PR #5597 protected merged main SHA bfdd7fa140ee2bd0a5ce21090f5cf72206b1ab2e; Netlify deploy 6af40e9c1a5e131bc6856f1c ready at 2026-11-11T06:45:15Z.
Independent production browser suite: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42974453301 — 15 passed, 1 failed, 1 skipped, exact deployed SHA pinned.
Original failure: `all 24 protected capability state paths survive demo save and native reopen` throws `PORTAL_BRAIN_REPLAY_SOURCE_CONFLICT`. Browser suite first replays many DEMO-only fields, then restores the original root. The original real-Brain pending map must never be populated by demo writes, even if the in-memory demo state uses the same shared form/impact widgets.

## Same-chain repair
- Existing `createPortalDomainState`: `stateClient.isDemo()` skips BusinessInput tracking and durable causal-impact backlog. The preview still emits the existing local `bg:portal-impact`, `bg:portal-pages-invalidated` and `bg:organism-impact` events to update dependent UI.
- No `bg:portal-brain-pending` event and no durable Brain ACK can be invented by demo state.
- Original authenticated customer input still tracks exact pending sections and impacts, persists the original journal, and requires a real authorized Brain provider ACK. Genuine stale external-source replay remains fail-closed.
- No new scheduler, connector, database, auth bypass, special route or duplicate state authority.

## Regression
- `portal-v2/tests/portal-demo-nondurable-bulk.test.mjs`: 25 input changes incl. nested strategy, demo save, native state readback and full root restore without fabricated Brain work.
- `tests/brain-portal-demo-no-false-handoff-20261111.test.mjs`: demo no pending acknowledgements and negative real-tenant no-ACK proof.
- Existing `tests/brain-portal-demo-canonical-ack-v4.test.mjs`, `portal-v2/tests/portal-server-handoff-restart.test.mjs` and protected production E2E unchanged.

## Production acceptance
Protected Required/BRAIN/Portal/CodeQL + exact build, merge, source-identical Netlify ready, then original Playwright `portal-v2-production-*.spec.js` must turn 1 remaining failure green. Public demo 100% E2E only verifies local demo routing and state; actual two authenticated customer tenants, provider readbacks and downstream Brain/Heartbeat/Powerhouse ACK per field remain separate open acceptance under #4215.

Netlify nonproduction preview visitor SSO in issue #4447 returned HTTP 401 during prior PR preview; never disable or bypass nonproduction security to force browser green. Public production readback is the authoritative published result.
