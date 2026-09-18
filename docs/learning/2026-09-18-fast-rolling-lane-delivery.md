# Fast Rolling Lane Delivery

Fingerprint: `powerhouse-fast-rolling-lane-delivery-v1`

Powerhouse develops in parallel but integrates through one rolling candidate per conflict contract. Agents use isolated workspaces; PR proliferation is not the parallelism mechanism.

For safe bounded deltas, Required and BRAIN use the same TURBO classifier and only block on changed tests, syntax and protected invariants. Security, auth, permissions, RLS, schema migrations, delivery-control-plane and unknown material scope remain outside TURBO.

The latency contract is: first CI signal within 60 seconds, TURBO blocking path within 240 seconds, STANDARD blocking path within 480 seconds. Missing runs, queue stalls, stale heads and superseded runs are recoverable incidents, not passive waiting states.

A non-overlapping movement of main does not invalidate a tested candidate. Real changed-path, dependency, contract or mutable-resource overlap refreshes only the affected rolling lane.

Once the exact head blocking profile is green, BG169 promotes it through the protected path. Broad unrelated assurance runs after merge on main with single-flight cancellation. Production/provider readback remains fresh and non-cacheable; a production regression uses the existing rollback authority.

This design reduces lead time without weakening security, data integrity, tenant isolation, schema safety, exact-head identity or production evidence.
