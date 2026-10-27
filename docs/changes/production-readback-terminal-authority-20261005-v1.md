# Production readback terminal authority — 5 October 2026

## Trigger

After PR #3788 merged, `Production Release Readback` succeeded on main `eb51760dc95db37b8e2ee1f02b30134dbc035782`, but `Canonical brand shell live readback` still failed.

Two independent authority drifts remained:

1. `brain/contracts/production-readback-v1.json` already classified the verifier files as non-runtime, while `tools/site-shell/production-supersession.mjs` still used an older narrower allowlist.
2. The pricing verifier compared raw `<h3>` markup. Live production encodes the visible label “Directie & AI Workshop” as `Directie &amp; AI Workshop`, producing a false negative even though the visible text is correct.

## Correction

- `production-supersession.mjs` now reads `productionTruth.verifierOnlyPaths` directly from the canonical production-readback contract.
- Real runtime paths remain unsafe and cannot use ancestor supersession.
- `live-contract.mjs` parses HTML and compares decoded heading text.
- The regression fixture explicitly uses `&amp;` so source/built encoding drift cannot recur.

No deployment requirement, exact-SHA rule, runtime safety rule, or production content gate is weakened.
