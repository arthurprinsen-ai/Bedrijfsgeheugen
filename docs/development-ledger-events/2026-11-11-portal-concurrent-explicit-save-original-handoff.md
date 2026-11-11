# 2026-11-11 original Portal V2 concurrent explicit save: no dropped second handoff

- Fingerprint: `portal|domain-state|explicit-concurrent-flush-joined-old-promise|20261111-v1`.
- Parent #4215; related #4198. Original owner: Portal V2 DomainState + ONE BRAIN same-principal BusinessInput writer.
- Observed source gap: overlapping explicit `flush()` calls always returned the older active promise. The new explicit save could finish without a second authenticated source/consumer round trip while the newer edit remained dirty.
- Root cause: single-flight correctly prevented duplicate *concurrent* backend writes but did not distinguish a newer *explicitly requested* source revision from the current in-flight snapshot.
- Repair: one queued follow-up promise on original flush only after a second explicit request. Follow-up retries newest source state at most once per request, using the existing identity, journal, causal impact, generation, and ACK path.
- Negative cases: no automatic saved status from unsent typing, no cross-tenant replay, no second worker/scheduler, original error retained, no provider send or fake outcome.
- Regression: `portal-v2/tests/portal-handoff-recovery.test.mjs`, `tests/brain-portal-concurrent-explicit-flush-20261111.test.mjs`.
- Verification boundary: protected GitHub admission, Required/BRAIN/CodeQL; exact Netlify production SHA plus authenticated browser/tenant readback before LIVE. The full downstream provider-to-Heartbeat-to-learned-action acceptance remains OPEN.
