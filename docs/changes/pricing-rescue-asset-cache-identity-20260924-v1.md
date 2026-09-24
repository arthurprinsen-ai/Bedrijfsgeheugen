# Pricing rescue asset cache identity — 24 september 2026

Fingerprint: `pricing-rescue-asset-cache-identity-v1`

## Incident

Exact production deploy `6ab58c611214c700089b7a93` was `ready`, `production`, and matched main `4aac008ef0872ab902e5888547bafc991c9eb259`. Affected-route readback passed, but the pricing browser proof timed out waiting for `html[data-bg-pricing-interactions="ready-v3"]`.

The HTML referenced:

`/assets/js/pricing-interactions-rescue-v1.js?v=20260924-0750`

while the runtime asset had been modified after that fixed version key. The current asset Git blob is:

`f7d85cb0d7ba7ff8c055895677a906066e702d83`

This allowed new HTML to be paired with a stale cached runtime.

## Fix

- pricing HTML uses `?v=f7d85cb0d7ba`;
- Production Source Snapshot checks that exact key;
- the generic build-preservation regression accepts a content-addressed 12-hex key;
- `tests/brain-pricing-rescue-asset-cache-identity-v1.test.mjs` calculates the Git blob SHA from file bytes and fails when the HTML key does not match.

This makes cache invalidation a machine-enforced source identity contract instead of a manual timestamp convention.

## v2 — build-integrity transform was nog stale

The first recovery correctly changed `prijzen.html` and the production snapshot proof, but `tools/site-shell/pricing-build-integrity.mjs` still contained `v=20260924-0750`. That transform can restore the rescue runtime after other build transforms, so it could overwrite a correct source reference with the stale key.

Skill Projection exposed this through the historical build-preservation replay.

v2:
- updates `pricing-build-integrity.mjs` to `v=f7d85cb0d7ba`;
- fixes the dynamic workflow-regex escaping in the cache-identity regression;
- extends the regression so source HTML, build integrity and Production Source Snapshot must all contain the same key.

The invariant is now end-to-end, not source-only.

