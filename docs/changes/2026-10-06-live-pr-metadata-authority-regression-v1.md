# Live PR metadata authority regression repair

## Contract

Delivery metadata authority now has an explicit two-sided rule:

1. A complete live PR body is authoritative for its current candidate. A same-obligation versioned manifest may be retained as advisory evidence, but cannot overwrite complete live metadata.
2. If the live PR body is incomplete, a valid same-obligation versioned manifest remains the fail-closed fallback.

A manifest from a different obligation never takes authority over the PR.

## Why this repair exists

#3986 changed runtime behavior intentionally, but the historical regression still asserted the old manifest-first rule. #3993 exposed that mismatch in the automation lane.
