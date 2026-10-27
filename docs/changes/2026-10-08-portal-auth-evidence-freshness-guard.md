# Portal evidence freshness: fail-closed protection

Authenticated Portal production evidence is valid only for its proven runtime lineage. The existing Required test workflow now checks the historical Brain evidence records against changes to the protected authentication runtime files. A stale LIVE_PROVEN claim blocks Required; claims must be downgraded to PENDING_PRODUCTION_PROOF until a fresh exact-runtime production readback proves HTTP 200, tenant scope, payload shape and synthetic cleanup.

The former evidence remains available for historical audit, not as a claim about the latest deployed runtime. The new control does not bypass authentication or production release gates. This PR does not claim a new production proof.
