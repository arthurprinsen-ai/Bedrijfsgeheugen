# Brain failure registry: evidence preservation and semantic cron dedup (P0 #4681)

Fingerprint: \`brain|incident-observe|evidence-overwrite-and-crosswriter-runid-dup|20261022-v1\`.

The existing SECURITY DEFINER \`brain_observe_failure\` previously overwrote promoted evidence with the latest occurrence JSON. The patch preserves the earliest/promoted summary; every new raw observation continues to be saved immutably in the existing \`brain_failure_occurrences\` table. Known cron aliases normalize to a common job/run identity scoped to the physical Supabase database; advisory transaction lock prevents two writers from incrementing one semantic event concurrently. Conflicting fingerprints or hashes fail closed.

The production audit found 20 raw occurrences and 11 distinct runs with 20 different payload hashes. **Do not erase, rewrite or silently coalesce these historic observations.** The new code preserves these rows and flags conflicted aliases rather than inventing a single trusted payload. Non-cron events retain their exact ID contract. No new scheduler or error backend.

Evidence gates: SQL rollback-only preview smoke, executable source regression, exact-head Required and CodeQL, security advisor/ACL readback, protected squash merge, deployed function readback, two actual concurrent writers, and proof the next real cron observations do not lose evidence. This PR does not fix the independent commercial 120-second cron #46 timeout. No production-green claim until verified.


## Current-main successor: project identity and NULL-safe proof

The predecessor [PR #4686](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4686) had two additional executed failures: explicit source projects collapsed to the same cron key, and a missing proof marker evaluated as SQL NULL instead of rejection. The same canonical obligation now preserves explicit project identity and both project-qualified job aliases. Projectless legacy aliases remain legacy-only; mixed scoped/unscoped job/run identity fails closed in either arrival order, without guessing a customer or project. A common cron-scope lock closes that ambiguity race before the full project-qualified event lock; an expression index bounds lookup.

Executed before publication: 6/1 Node RED then 7/0 GREEN; actual PostgreSQL CROSS_PROJECT_EVENT_COLLISION on the unchanged predecessor, then full positive/negative SQL PASS inside temporary candidate BEGIN/ROLLBACK. Different projects count separately, same-project aliases deduplicate, both ambiguous arrival orders reject, absent proof rejects, and promoted evidence/hash-conflict behavior remains covered. Readback restored predecessor function MD5 82e5a92e04044aceff66f2456ab7daab and both fixture counts were zero. These tests are preview evidence only. The production function is still unmodified until protected source promotion and independent provider readback.

Current-main lineage replaces the stale predecessor; never run both as active candidates. Reuse dedicated preview fkwcclhwfdvwkyyxdcys and the existing #4681 registry, owner and daily executor. No separate scheduler, incident register or commercial sends. New exact-head Required/CodeQL/provider, concurrency and ACL proof plus post-merge source/hash/ACL readback remain mandatory. #4215 snapshot performance remains separate.

