# P0 #4215 — legacy BusinessInput cross-tenant migration containment

## Observed production-source defect

`portal-v2/business-input-store.js::readLegacyPortalBusinessInputs` enumerated the entire shared browser localStorage for `bg_portaal_*`, passing every old customer state as a canonical `LegacyPortalState` write. `portal-v2/domain-state.js::performInit` gated on the existence of **any** legacy cache key and then sent every returned customer record under the current authenticated authorization bearer. A shared browser or account switch could import a former customer's data into another customer's ONE BRAIN lineage. The previously repaired compliance adapter did not protect this independent mutation path.

## Minimal fix on existing authority

- Reuse the existing single-user `readLegacyPortalStateForUser` reader; only the exact `bg_portaal_<normalized signed-in email>` may be imported.
- No identity means no legacy business input listing or write.
- Portal boot gates only on an exact match and passes `stateClient.currentUser()` to the reader. No cache scan.
- Standalone migration must have an explicit authorized user and bearer before attempting any provider side effect.
- Keep existing canonical BusinessInput server writer, ONE BRAIN, Heartbeat and client state. Server-side authorization is authoritative; this is browser-local boundary hardening.

## Regression / protected CI

`node --test tests/brain-p0-4215-legacy-business-input-tenant-isolation-v1.test.mjs tests/portal-business-input.test.mjs portal-v2/tests/domain-state.test.mjs`

Cases: no identity + singleton cache, two users + colliding prefix, browser boot with other customer cache, authenticated own-key positive control, standalone migration absent bearer rejection and authenticated exact-key transport.

## Proof boundary

Protected Required, CodeQL and exact Netlify publication/readback must be verified independently. Source-level mock identity tests are *not* two real authenticated customer browser sessions or an end-to-end Brain provider consumer ACK. P0 #4215 stays open until real evidence exists.
