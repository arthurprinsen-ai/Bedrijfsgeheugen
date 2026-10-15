# Foresight runtime projection: ephemeral tenant Brain data

Obligation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4426

## Defect

Portal V2's `setDerived('portal.runtime', runtime)` called the mutable `domain.project()`. A later customer edit and `flush()` could include the temporary Brain operating-loop observation in the durable portal state. UI display needs these observations but permanent storage is not authoritative.

## Fix

The domain state now has an isolated `portal.runtime` in-memory overlay. `get()` and `subscribe()` provide the merged read-only view, while `flush()` persists only customer-edited canonical fields and strips historically persisted runtime snapshots. `init()` clears the overlay before loading another user. Other derived write paths are rejected. Runtime requests without a Bearer authentication header fail closed without making a network call.

This does not activate global Powerhouse forecasts, create a new source, prove numeric forecast quality, or grant new provider authorization. Those capabilities remain separate to customer-governed source validation and independent backtesting. Existing operating-loop API provides tenant scoping.

Regression: `node --test portal-v2/tests/ephemeral-brain-runtime.test.mjs` plus canonical `tests/brain-portal-ephemeral-runtime-canonicalization.test.mjs`.

## Production acceptance

Only mark completed after Required CI and CodeQL, branch-protected merge, Netlify exact SHA deployment, and authenticated tenant-specific readback. Anonymous browser content must not expose tenant data.
