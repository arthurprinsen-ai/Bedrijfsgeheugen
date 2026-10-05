# One commercial closed loop — delivery closure evidence

Date: 2026-10-05  
PR: #3739  
Obligation: `one-commercial-closed-loop-v2`

## Event

The exact-head Required test correctly failed closed with `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE`. Hygiene/admission itself was green, but the material R4 Supabase candidate contained no repository closure artifacts.

## Root cause

The runtime migration was canonicalized first, while the Integration Bundle policy requires three evidence surfaces in the same candidate: `brain/learning/`, a development-ledger event, and human-readable change documentation.

## Structural correction

This candidate now carries all three closure surfaces alongside the runtime migration. The Required test remains the canonical gate and must re-evaluate the full exact-head candidate. No prior sibling workflow success, stale HEAD, or mergeable PR state is accepted as terminal evidence.

## Terminal invariant

`runtime change -> repository closure evidence -> exact-HEAD full checkset -> merge -> production readback -> terminal closure`

No merge or LIVE_BEWEZEN claim is permitted before the chain above is complete.
