# Component test delivery classification v1

## Root cause
Reusable website components were correctly owned by the website delivery lane, but their tests under `tests/components/` were not. A valid pricing regression repair therefore failed delivery admission as an unclassified path.

## Fix
- `tests/components/` is now part of the website lane.
- A Brain regression proves `tests/components/pricing.test.mjs` resolves to the website lane.
- The pricing component baseline itself is aligned to the canonical €2.950 Scan price and forbids the retired €2.400 remote variant.

## Prevention
A component and its executable regression belong to the same delivery ownership boundary.
