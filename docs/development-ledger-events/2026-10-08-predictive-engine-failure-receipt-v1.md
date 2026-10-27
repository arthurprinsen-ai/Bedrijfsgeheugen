# Predictive engine failure-receipt recovery

Obligation: `powerhouse-principle-regression-v1`

On 2026-10-08 the canonical predictive-engine invocation reached Supabase Edge deployment 79, updated runtime signal state, and failed. Its error handler then masked the primary exception with `TypeError: db.from(...).insert(...).catch is not a function`.

The recovery changes only the existing canonical function. It awaits the health-receipt insert inside a bounded nested `try/catch`, preserving the primary exception when receipt persistence also fails. A focused source regression prevents query-builder `.catch()` chaining from returning.

Required test run 37741404836 correctly rejected the first repair head because the material candidate omitted mandatory same-lineage learning, ledger and human-readable closure evidence. Those artifacts are now part of this same candidate; the gate was not weakened.

No scheduler, store, publisher, provider identity, credential or database migration is added. Terminal completion still requires an exact-head protected merge, deployed Edge-function readback, a single reconciled retry, and refreshed predictive-health evidence.
