# Platform live-production contract — 2026-10-03

Obligation: `platform-navigation-product-route-20261003-v1`

Structural closure added after the canonical generator and final-navigation fixes:

- live production readback now checks the actual Platform href;
- desktop and mobile counterparts are mandatory;
- only the canonical origin with pathname `/product` is accepted;
- stale `/bedrijfsgeheugen`, external destinations and missing counterparts fail closed;
- a dedicated regression test covers the invariant.

Acceptance is no longer limited to candidate/build output: the deployed HTML must satisfy the same route contract.
