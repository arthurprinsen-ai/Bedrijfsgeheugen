# Branch drift: eliminate unnecessary synchronization

## Incident and cause
PR #4907 was repeatedly described as behind main. Repeated unconditional syncs spawn more CI work and invalidate previously checked commit identities. Being behind main is a signal, not proof that the candidate is unsafe.

## Preventive contract
The new `tools/delivery/branch-drift-guard.mjs` reuses canonical path and conflict-contract evaluation; skips updates for unrelated main changes, refuses incomplete snapshots and terminal writer leases, and only emits a guarded sync recommendation on conflict. Its result includes exact head SHA and observed main SHA for the existing single writer. It cannot merge, post external content, or fabricate success.

## Verification
Run `node --test tests/brain-branch-drift-guard.test.mjs` with Required CI and CodeQL. Record protected merge and independent production readback before calling the rollout live. There is no new scheduled job or second delivery queue.
