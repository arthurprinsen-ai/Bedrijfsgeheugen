# Growth-drain eventual-consistency read incident — 25 October 2026

- Obligation-ID: `netlify|growth-drain|strong-consistency-missing-read-verification|20261025-v1`
- Parent P0 #4446 and commercial P0 #4198
- Observed after #4911: 2026-10-25 16:07 UTC failed indexed source reads count 3, invalid pointers 0, simultaneously 4 DataHub persistence acknowledgements.
- Provider contract: Netlify Blobs eventual read default; documented strong read override at https://docs.netlify.com/build/data-and-storage/netlify-blobs/
- Scoped recovery: strong read only after default null for indexed pointer and canonical source; preserve provider errors and empty authoritative source as red.
- Regression: `node --test tests/brain-growth-drain-time-budget-v1.test.mjs`; exact Required/CodeQL/Netlify release gates.
- Terminal: no conversion or revenue green from queue readiness; evidence receipt remains independent.
