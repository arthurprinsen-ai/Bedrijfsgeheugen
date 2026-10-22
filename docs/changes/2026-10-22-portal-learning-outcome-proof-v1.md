# Living Memory proof gate for Relevantie & verbeteringen

Fingerprint: `portal|learning-memory|proven-without-verified-outcome-evidence|20261022-v1`

## Observed source defect
Merged PR #4673 projects Brain memories to the Portal UI, but a raw `status=PROVEN` was mapped to generic `status=ok,healthy=true` with no independent outcome check. This could present an unproven record as "Bewezen in Brain".

## Corrective, source-preserving contract
Before a memory may retain `PROVEN` in the **derived** existing tenant Brain projection, check the memory is itself verified, has evidence IDs pointing to real verified same-tenant Evidence records, and references an executed, verified same-tenant Outcome with nonempty result and owner, sharing matching evidence IDs. Otherwise derive `REVIEW_REQUIRED`, preserving the unchanged stored source record. This is a fail-closed reduction in claims, not a new scheduler, store, customer write or model. No cross-tenant lookups.

Regression: `tests/brain-portal-learning-memory-evidence-proof-v1.test.mjs`. Canonical learning, self-improvement skill, System Map and append-only ledger delivered together. Protected Required, CodeQL, exact deployment, authenticated A/B tenant readback and full BRAIN remain independent release gates.
