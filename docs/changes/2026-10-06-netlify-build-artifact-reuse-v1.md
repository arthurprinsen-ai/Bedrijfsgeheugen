# Netlify build-once + prebuilt artifact reuse — 2026-10-06

## Problem
The deterministic website build still consumed roughly a minute per execution and was repeated between pre-merge proof and post-merge Netlify promotion. The static locale compiler alone repeatedly parsed and serialized the same public route corpus. Build commands were duplicated across production, deploy-preview and local fallback.

## Structural fix
- One canonical build entrypoint now owns the complete production phase order.
- Required executes that build once, records per-phase timing, and publishes an immutable prebuilt artifact keyed by the Git tree SHA.
- Production may reuse only an artifact from a successful same-repository `Required test` run whose manifest tree and archive SHA-256 match current main.
- The reused artifact still goes through the existing authorized Netlify Build API transport, so Functions and Edge Function packaging remain provider-owned.
- Netlify only skips the expensive deterministic site transforms on verified reuse; it restamps the final main commit/deploy identity and retains the complete full-build fallback.
- Static NL/EN route output uses a content-addressed cache shared through GitHub Actions and Netlify's build cache.

Regression: `tests/brain-netlify-prebuilt-artifact-reuse-v1.test.mjs`.

## Performance acceptance
- Warm Required builds report phase timings and cache-hit counts instead of relying on elapsed-run guesses.
- When the merged main tree equals the proven candidate tree, production promotion must not execute the deterministic ~69-second site-transform chain again.
- When the tree differs or proof is unavailable, correctness wins: run the complete canonical build and record the fallback reason.

## Required rerun invariant
A partial failed-job rerun is not accepted as terminal evidence when aggregate outputs depend on jobs from the original attempt; use one coherent exact-HEAD Required attempt for final proof.

Exact-head proof trigger: synchronize after correcting machine metadata; this line carries no runtime behavior.
