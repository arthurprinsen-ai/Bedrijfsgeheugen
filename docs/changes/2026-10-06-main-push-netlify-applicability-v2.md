# Main-push Netlify applicability v2

## Problem

Required test, native Netlify build-ignore, Production Source Snapshot and Production Release Readback each had separate rules for whether a change required Netlify.

On 6 October 2026 snapshot run `37470438032` failed after three 401 fallback attempts while later recovery still succeeded. A Supabase-only main SHA `2b0539cb729b658bc5e85184406d8421e56f9d35` also ran the full snapshot/deploy/browser chain and produced Netlify deploy `6ac4f8719740e80008deedb7` with 124 seconds deploy time.

## Structural fix

`tools/delivery/netlify-deployment-applicability.mjs` is now the single repository authority for Netlify applicability and is consumed by PR parity, native build-ignore, Production Source Snapshot and Production Release Readback.

Pure Supabase pushes are statically ignored by the two Netlify production workflows. Mixed changes remain fail-closed: website, portal and Netlify-hosted runtime paths still require exact-SHA deployment/readback.

## Safety

This removes only non-applicable Netlify work. Required, CodeQL, protected merge, Supabase provider authority and exact production/browser evidence remain intact.
