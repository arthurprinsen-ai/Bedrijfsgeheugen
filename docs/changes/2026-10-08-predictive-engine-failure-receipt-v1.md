# Predictive engine failure receipt v1

## Change

The existing `powerhouse-predictive-engine` error path no longer calls `.catch()` on a Supabase query builder. The receipt insert is awaited inside a nested `try/catch`, so a secondary receipt failure cannot hide the original predictive failure.

## Why

Production Edge deployment 79 emitted `TypeError: db.from(...).insert(...).catch is not a function`. That exception came from the recovery path and obscured the real failing operation, leaving no same-day predictive run receipt.

## Regression

`tests/brain-predictive-production-lineage.test.mjs` now enforces both sides of the contract:

- query-builder `.catch()` chaining is forbidden;
- the failure receipt is awaited inside a bounded nested `try/catch`.

The first exact repair head was intentionally rejected by Required test with `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE` because it did not yet carry all mandatory same-lineage closure artifacts. This candidate records that failure and satisfies the gate without bypassing it.

## Completion boundary

This change is not considered live from source or CI alone. Completion requires protected merge, production Edge-function deployment/readback, one safe reconciled rerun, and current predictive-health evidence. The canonical obligation remains open until that chain is proven.

The exact five-file PR scope is declared in the canonical delivery contract so fresh CI evaluates the current candidate rather than the earlier two-file head.
