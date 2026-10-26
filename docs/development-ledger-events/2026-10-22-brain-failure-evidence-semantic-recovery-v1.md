# Development ledger · 2026-10-22 · Brain incident evidence durability

Canonical issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4681
Fingerprint: \`brain|incident-observe|evidence-overwrite-and-crosswriter-runid-dup|20261022-v1\`
Status: CANDIDATE, not live proven. Delivery-Lane: backend.

Observed proof: production \`brain_observe_failure\` executes \`evidence=coalesce(p_evidence,evidence)\`; cron 46 contains 20 raw occurrence records for 11 normalized runs, 20 distinct hash pairs. No historical row deleted and no missing verified proof manufactured.

Root cause: whole-document JSON replacement and literal-only occurrence_id dedupe. Fix candidate: retain registry evidence after promotion; new raw JSON stays in canonical append-only occurrence table; semantic alias parser + advisory per-event lock; old conflicting hashes fail closed. Pure-expression index accelerates identity lookups; no duplicate store. Explicit source guard prevents silent source drift.

Verification obligations: isolated preview transaction ROLLBACK, exact PR-head Required and CodeQL, runtime concurrency and fail-closed conflict tests, security definer owner/search_path/ACL check, protected merge and postrelease provider/database readback. Cron 46 commercial snapshot remains a separate release hold (#4215). Never bypass branch protection or fabricate revenue, customer sessions or green badges.


## Current-main successor: project identity and NULL-safe proof

The predecessor [PR #4686](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4686) had two additional executed failures: explicit source projects collapsed to the same cron key, and a missing proof marker evaluated as SQL NULL instead of rejection. The same canonical obligation now preserves explicit project identity and both project-qualified job aliases. Projectless legacy aliases remain legacy-only; mixed scoped/unscoped job/run identity fails closed in either arrival order, without guessing a customer or project. A common cron-scope lock closes that ambiguity race before the full project-qualified event lock; an expression index bounds lookup.

Executed before publication: 6/1 Node RED then 7/0 GREEN; actual PostgreSQL CROSS_PROJECT_EVENT_COLLISION on the unchanged predecessor, then full positive/negative SQL PASS inside temporary candidate BEGIN/ROLLBACK. Different projects count separately, same-project aliases deduplicate, both ambiguous arrival orders reject, absent proof rejects, and promoted evidence/hash-conflict behavior remains covered. Readback restored predecessor function MD5 82e5a92e04044aceff66f2456ab7daab and both fixture counts were zero. These tests are preview evidence only. The production function is still unmodified until protected source promotion and independent provider readback.

Current-main lineage replaces the stale predecessor; never run both as active candidates. Reuse dedicated preview fkwcclhwfdvwkyyxdcys and the existing #4681 registry, owner and daily executor. No separate scheduler, incident register or commercial sends. New exact-head Required/CodeQL/provider, concurrency and ACL proof plus post-merge source/hash/ACL readback remain mandatory. #4215 snapshot performance remains separate.

