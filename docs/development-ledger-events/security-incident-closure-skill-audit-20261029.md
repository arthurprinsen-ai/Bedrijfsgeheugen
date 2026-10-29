# Security incident audit and skills — public-safe change event (2026-10-29)

- Canonical change: two existing skills, one existing incident-protocol baseline and one existing agent regression test. No new scheduler, worker, publisher, queue, memory or private customer state.
- Failure-class lesson: do not conflate a GitHub/preview/public destination with internal staging or confuse safe PR closure and branch cleanup with full historical record erasure.
- Prevention: mandatory last-egress authorization; sanitized immutable, deduplicated event receipts in existing PRIVATE ONE BRAIN; independent provider readback; bounded self-repair and regression test. Internal source data is **not** reproduced here.
- Evidence: the source-contract test `tests/brain-social-delivery-agent-handoff-20261029.test.mjs` checks the public-safe skill markers and policy. This is not a provider-side execution or proof that every runtime agent is already instrumented.
- Release state: candidate only, pending Required/BRAIN/CodeQL, current-main reconciliation, exclusive integration writer approval and production/skill projection readback. Historical copies require their own review.
