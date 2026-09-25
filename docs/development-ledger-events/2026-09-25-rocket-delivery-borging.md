# Development ledger — Rocket Delivery borging

Date: 2026-09-25  
Obligation: rocket-delivery-borging-20260925

## Event

Borging closure for PR #3096 after protected merge and successful exact-main production/browser readback.

## Root cause recorded

A false-negative test oracle used regex semantics for a fixed GitHub Actions expression containing `${{ ... }}`. The implementation was correct; the assertion was not.

## Prevention projected

1. Fixed GitHub workflow expressions are tested literally by default.
2. Apparent mismatches that visibly contain the expected literal trigger test-oracle diagnosis before implementation changes.
3. Fan-out reductions are verified on the exact post-merge `main` SHA by enumerating actual workflow runs.
4. Brain learning, skill projection, human documentation and ledger evidence remain one material closure obligation.

## Evidence

- PR #3096 protected merge: `e8054fc35dc2d824afa87a417790a2c3e073062f`
- production/browser readback: successful
- exact-main run observation: seven workflows, without the prior broad inapplicable production fan-out
