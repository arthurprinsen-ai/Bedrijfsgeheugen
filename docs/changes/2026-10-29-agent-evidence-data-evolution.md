# Change & human documentation — 29 October 2026
**Obligation:** `powerhouse|agent-provenance-data-quality|20261029-v1` · **State:** protected PR candidate, NOT production verified.

## What changes and why
When an automated step runs, the business needs to know whether it was actually done by an agent, executed by SQL, completed by a person, or confirmed by a provider. The previous 24-hour Powerhouse cycle evidence had 1,587 events but no explicit agent ID, skill version or paired before/after metric. This does **not** prove 1,587 agent failures; most events are SQL decision stages.

The existing Powerhouse incident and Lean policy now requires actor-type separation, agent provenance, data-source freshness, automatic safe recovery of bad/missing data, documented changes, portal readback and results that matter commercially. The existing chat-learning preflight rejects removal of these critical rules.

## Existing architecture; no parallel authority
Use ONE BRAIN + Powerhouse + Heartbeat + the existing exclusive writer, canonical `public.powerhouse_cycle_events`, Brain incident and learning registries, existing secure Portal V2 observability and protected deployment path. No second scheduler or duplicate publication.

## What is not yet delivered
This candidate **does not instrument each live agent producer** and **does not by itself update the live portal**. Runtime attribution, provider acknowledgments, 2-tenant authenticated browser readback, precise revenue attribution, protected merge and exact production readback are OPEN obligations. Unknown metrics are not zero; no invented uplift.

## Acceptance and prevention
- Verify `node --test scripts/brain/agent-evidence-contract.test.mjs`, Required, BRAIN and CodeQL on exact head.
- Confirm live agent producer event fields/ACK through the existing writer and independent source readback.
- Ensure privacy-minimized tenant-scoped portal/handbook/System Map projections and test errors, stale data, duplicate effects and rollback.
- Compare qualified visitors → leads → orders → paid revenue against a valid baseline. Only verified improvements become reusable skills/guards.
- Preserve distinct proof levels: policy, runtime action, portal release, business outcome.

Source: [PR #5134](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5134), [issue #4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215).
