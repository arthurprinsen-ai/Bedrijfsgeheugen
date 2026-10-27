# Production readback HTML-entity heading recovery — 5 October 2026

## Trigger
After #3788 merged, Netlify production was exact on merge SHA `eb51760dc95db37b8e2ee1f02b30134dbc035782` and deploy `6ac3eae7a5a0b8000855de71`, but the canonical shell live readback remained in the live contract step.

## Root cause
The production DOM correctly serializes `Directie & AI Workshop` as `Directie &amp; AI Workshop`. The verifier compared raw HTML literally and therefore treated semantically identical HTML as missing content.

## Correction
`tools/site-shell/live-contract.mjs` now accepts the raw or correctly HTML-entity-encoded form of required heading text. The consulting proposition, exact release identity, pricing structure and retired-contract rejection remain mandatory.

`tools/site-shell/test-live-contract.mjs` now contains a regression fixture for the encoded heading.
