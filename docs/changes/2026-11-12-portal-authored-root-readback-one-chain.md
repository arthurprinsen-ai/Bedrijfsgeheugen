# P0 #4215 — read back the complete authored Portal V2 BusinessInput

- Date: 2026-11-12
- Fingerprint: `portal|customer-authoring|non-portal-root-readback-was-not-checked|20261112-v1`
- Original authority: `portal-v2/portal-state.js`, original authenticated `/api/portal-business-input` followed by `/api/portal-state`.
- Delivery lane: `portal`; candidate type: `recovery`; original portal owner, no second writer/scheduler.
- Related: #4215, #4547, #4198.

## Reproducible defect
The previously protected persistence contract checked only `nextState.portal` against `GET.state.portal`. Non-derived authored root-level keys were **already** sent to canonical BusinessInput but could return stale from the subsequent authenticated Portal State GET without triggering `PORTAL_STATE_VALUE_READBACK_MISMATCH`.

## Bounded original-chain correction
Keep the strict existing `authorityStored/powerhouseFeedStored/organismImpactStored/sourceRevision` ACK, then `stored:true,stale:false` from the original state projection, then the original authenticated GET. Compare **all** `buildPortalBusinessInput(nextState).answers` to the received same-identity state. The existing builder already excludes derived read-only models and the internal Brain handoff manifest. Nested zero, false, null, arrays and objects retain exact-value semantics. No additional API call, database, migration, queue, agent, scheduler or consumer.

## Regression
Add two tests to the original `portal-v2/tests/portal-business-input-persistence.test.mjs`: an unchanged root-level value must refuse save; an exact root-level zero/null value must pass despite an independently refreshed derived read-only model.

## Terminal acceptance boundary
Only protected exact-head Required/CodeQL/BRAIN, protected merge, current exact Netlify READY source and independent original portal DOM and authenticated browser readback may promote THIS source fix to live. Separate P0 #4215 still requires genuinely authorized two-tenant field coverage, 1000 external observations, exact tenant/sourceRevision/consumer_processed_ack, Powerhouse/Heartbeat update, authorized action, measured outcome/holdout and next natural-run learning. No fabricated green. Preserve active executor and original owner leases.
