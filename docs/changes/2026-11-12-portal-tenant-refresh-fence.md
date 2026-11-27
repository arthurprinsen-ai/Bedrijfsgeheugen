# Portal V2 — same-member tenant refresh fence, original one-loop handoff

**Date:** 2026-11-12. **Original owner:** #4215, with #4198 as separate commercial effect owner.

## Proven source defects

1. `createPortalDomainState.refresh` compared only identity `id`/email, while the existing `currentPrincipal` includes the server-issued `app_metadata.tenantId`. A user with multiple authorized companies could refresh a domain initialized under tenant A while tenant B is selected. No original source-to-consumer receipt could justify the projected customer context.
2. Public `set('portal')` and `patch('portal')` could add a changed impact but `businessInputBinding('portal')` returns no binding. The impact could remain orphaned while the unrelated state flush appears successful. Public changes to `portal.runtime` or the server handoff journal would also violate the internal/view-only authority boundary.

## Single-owner correction

In the **existing** `portal-v2/domain-state.js`, compare the exact hydrated `currentPrincipal()` (member plus tenant) on focus/visibility/15-min refresh and after asynchronous readback. A tenant change requires the existing authenticated `init()` rather than an implicit refresh. Never rehydrate another tenant automatically.

Reject only direct root and internal runtime/journal paths **before** any public `set`/`patch`; the existing section/field paths, original internal journal persistence, view-only `setDerived`, original BusinessInput posts, state writer, server source revision, original ONE BRAIN handoffs and recoveries remain unchanged.

Updated original `agent-reliability`, `agent-data-quality`, Portaal Living Interface skill, machine ONE BRAIN learning and replay tests. No alternate agent, CRON, web worker, storage, tenant, provider, commercial send or duplicate execution.

## Proof boundaries

Source changes and fixture tests do **not** prove live tenant browser outcomes, complete 200-field/1000-signal coverage, independent provider consumer processing, full CRO experiments or realized revenue. Do not mark those terminal states GREEN. Source release requires all protected exact-head checks, protected merge, Netlify CURRENT READY exact SHA and independently authorized production readback. Preserve #4215 and #4198 OPEN until separate acceptance is proven.
