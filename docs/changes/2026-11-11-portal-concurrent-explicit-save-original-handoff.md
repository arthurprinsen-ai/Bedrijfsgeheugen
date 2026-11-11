# 2026-11-11 — No dropped second explicitly requested Portal save

Parent: #4215. Related: #4198. Fingerprint: `portal|domain-state|explicit-concurrent-flush-joined-old-promise|20261111-v1`.

## Reproduced source defect

The existing Portal V2 `createPortalDomainState.flush` returned `activePortalFlush` for every overlapping caller. If a first save was still waiting for original BusinessInput/Brain acknowledgment, a newly changed customer field followed by an explicit second save could receive the already-running *older* promise. The later value remained `dirty` or as an unacknowledged pending handoff with no subsequent original flush requested by that action. The existing 15-minute revalidation is recovery, not an immediate explicit-save guarantee.

## Safe original-owner repair

Retain original `domain`, original state writer, same authenticated principal, original pending revision and Brain journal. Coalesce overlapping **explicit** second/third callers onto one queued follow-up. Once the first producer/consumer call finishes successfully, the queued follow-up invokes the same `flush()` once only if newer dirty state or pending original handoff remains. No automatic save is triggered solely by typing. If the prior flush failed, propagate that error without uncontrolled retries or double provider effects. Existing tenant/auth consistency checks and recovery journal remain untouched. No scheduler, new state table or second Brain.

## Regression and release evidence

- `portal-v2/tests/portal-handoff-recovery.test.mjs`: stalled Brain first ACK, newer explicit second save, coalesced duplicate callers, unchanged exact snapshots, no silent automatic typed-data save.
- `tests/brain-portal-concurrent-explicit-flush-20261111.test.mjs`: original source/agent/skill invariant and existing tenant/recovery suite.
- Original protected admission + Required/BRAIN/CodeQL + exact current-main READY Netlify + production authenticated tenant readback are required. A source unit test is not proof of all two genuine customer contexts or provider downstream outcomes.

Outcome: preserve all previous source lines and show correct original writer acceptance, **not** authorized approval, external provider action, Heartbeat measurement or applied learning. Historical OPEN commercial/content obligations remain unchanged.
