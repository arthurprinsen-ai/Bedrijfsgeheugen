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
