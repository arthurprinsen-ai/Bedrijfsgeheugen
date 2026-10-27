# Production readback shell authority split — 5 October 2026

## Trigger

The pricing recovery merged on main, but Canonical brand shell live readback still failed. The failure was not in the new pricing verifier: `tools/site-shell/contracts.mjs` independently required the retired `bgx-vraagbalk`, `bgx-rekenaar` and `bgx-rol` pricing tools.

## Root cause

Pricing semantics had two authorities. `live-contract.mjs` had been updated to the current Starter / Pro / Groei / Enterprise model, while the global shell contract still encoded historical route-specific markup.

## Correction

- `contracts.mjs` now validates only global shell identity and legacy pricing header rejection.
- Pricing business semantics remain in `live-contract.mjs`.
- The shell regression fixture no longer fabricates retired pricing page-tools.
- A Brain regression test guarantees that retired pricing component names cannot return to the global shell authority.

Exact release identity, shared shell hashes and production readback remain fail closed.
