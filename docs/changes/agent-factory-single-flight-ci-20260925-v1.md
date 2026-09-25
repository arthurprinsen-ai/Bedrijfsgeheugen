# Agent Factory CI consolidation

The delivery architecture now treats GitHub Actions as one change-scoped control plane instead of a collection of independent PR-triggered verification islands.

## Root cause
`Required test` already selected backend, portal, automation and website lanes, but its final job also polled a complete `Unified Brain Delivery` run. Separate live-preview and pricing workflows could run for the same PR as well. This multiplied runner demand and caused queue amplification under many simultaneous chats/agents.

## Change
- `Required test` remains the canonical aggregate PR gate.
- The sibling BRAIN polling loop was removed.
- Unified BRAIN delivery remains explicit/manual recovery tooling rather than automatic PR fan-out.
- Live Preview Smoke is reusable/manual.
- Pricing SEO regression is reusable/manual and its tests are part of the website baseline lane.
- Brain foundation verification runs after integration on `main`, not on every feature-branch push.
- Regression coverage now asserts the single-flight invariant.

## Prevention
A new workflow or agent must not create another automatic heavy PR entrypoint when the contract belongs inside an existing lane. New coverage is added to the relevant reusable lane and selected by change classification. Independent scopes remain parallel; terminal production landing remains serialized and exact-head verified.
