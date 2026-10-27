# Production supersession verifier-only alignment — 5 October 2026

## Trigger

After #3788 merged, the canonical brand shell production readback still failed even though Netlify production was ready on the current main SHA and the growth endpoint returned the expected 405 contract.

The failure evidence showed:

- expected ancestor: `cf0b4b6a77b19cfafc69f19d7151dae43a5662f0`
- observed production: `eb51760dc95db37b8e2ee1f02b30134dbc035782`
- rejected paths: `brain/contracts/production-readback-v1.json`, `tools/site-shell/live-contract.mjs`, `tools/site-shell/test-live-contract.mjs`

Those files are explicitly verifier-only in the production-readback contract, but the production-supersession helper did not know that.

## Correction

`tools/site-shell/production-supersession.mjs` now treats the same explicit verifier-only files as non-runtime for safe descendant supersession. Real website/runtime paths remain unsafe and continue to fail closed.

The regression suite verifies both directions.
