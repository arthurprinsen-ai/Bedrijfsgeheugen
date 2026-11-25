# Canonical Portal V2 — safe live revalidation
Parent issue: [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215)
Obligation: `portal|safe-server-revalidation|20261020`

## Failure mode
The existing Powerhouse/Heartbeat/Brain data changes on the server while a customer has a portal page open. The browser's domain-state implementation previously only called `init()` after a sign-in transition, and the overview reacted to local state changes. A customer viewing Frisse Blik-related inputs, executive dashboards, compliance or external intelligence could keep reading stale server values until page reload. Reusing `init()` for a timer would erase unacknowledged edits or rerun legacy browser migration.

## Scope (no duplicate authority)
- `createDomainState.refresh()` revalidates the existing canonical authenticated server state. It applies only when initialized, saved/idle, same version at fetch completion, and a caller-supplied authorization/ack guard still permits it. An unchanged readback does not rerender.
- `createPortalDomainState.refresh()` additionally requires a stable authenticated principal, no pending state write, no pending Brain BusinessInput/organism impacts, no legacy migration and non-demo. A stale tenant response cannot enter another account.
- `app.js` performs visible-page 15-minute canonical reads and focused/visible foreground revalidation, with a 60-second request floor, no duplicate timer on the server.
- `page-shell.js` invalidates an open derived workspace only after changed, authenticated readback. Focused form inputs and saving/dirty state stay untouched. Existing page renderers, dynamic dashboards, Source Universe and heartbeat retain their original implementation.

## Evidentiary boundaries
This is a mechanism to **read** new server data, not a way to fabricate or automatically generate financial records, verified business value, CSRD compliance, tenant provisioning, provider consent, or confirmed customer outcomes. Portal freshness != source-catalog-connected != every customer connector active. `portal_financial_forecasts_v1=0` and `intelligence outcome_ref=0` in 2026-10-20 production remain independent P0 failures unless newly verified by provider receipts.

## Gate
Exact-head Required CI, CodeQL, tested two-tenant readback of edit/dirty-save/source revision, authenticated Portal V2 Chromium mobile/navigation, Netlify exact-deploy readback, Supabase canonical origin evidence. No force merge and no terminal DONE claim before all relevant current tests pass.
