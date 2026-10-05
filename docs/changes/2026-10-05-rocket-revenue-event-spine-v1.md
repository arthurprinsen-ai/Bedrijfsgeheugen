# Powerhouse Rocket revenue event spine v1

Date: 2026-10-05

Bedrijfsgeheugen now uses one canonical revenue-intelligence spine over the existing Powerhouse Growth & Revenue OS. The implementation deliberately reuses the mature `growth_events`, opportunities, sales actions/outcomes, experiment and NBA layers instead of introducing a parallel CRM or second event store.

## Canonical flow

`signal/event → identity/company resolution → intent score → next best action → existing execution gates → outcome/revenue → multi-touch attribution → learning/experiment update`

The new layer adds a canonical event taxonomy, privacy-bounded identity graph, continuous prospect intent score, observed position-based multi-touch attribution, a canonical NBA contract over NBA v5, and a lightweight orchestration/health contract.

## Identity and privacy

Raw first-party events remain in the existing event store. The identity graph stores canonical person/company keys and normalized identifier hashes; it does not create a second raw e-mail or LinkedIn identifier store.

## Attribution

Observed revenue is allocated across observed touches using a position-based first/middle/conversion model. This is explicitly attribution, not causal proof. Attribution snapshots are refreshed four times per hour and include a balance check against observed outcome revenue.

## Intent and NBA

Intent is continuously derived from recent behavioral events, opportunity probability/confidence and recency. The resulting score augments the existing `powerhouse_commercial_next_best_action_v5`; consent, contact-pressure, identity, dedupe, channel-capability and provider-readback gates remain authoritative.

## Non-blocking orchestration

Heavy relationship, learning, experiment and snapshot engines keep their existing idempotent schedulers. The canonical spine links their shared lineage and refreshes only the lightweight stateful layers synchronously. This prevents one heavyweight analysis or concurrent runtime write from blocking the full commercial system.

## Production proof

Production readback on 2026-10-05 confirmed 23,784 identity entities, 47,725 identifiers, 33 multi-touch attribution rows, 422 existing NBA snapshot rows, balanced observed attribution, and runtime evidence marked `actioned / VERIFIED / confidence 1`.


## Delivery closure

Brain learning, development ledger and regression evidence are versioned in the same candidate scope so the material backend change is reproducible and auditable.
