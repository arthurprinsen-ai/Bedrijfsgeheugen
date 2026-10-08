# Development ledger — Source Universe operational truth v1

- Obligation: `source-universe-operational-truth-v1`
- Candidate: protected delivery; no production-green claim.
- Root cause: catalog availability was not distinguished from observed freshness and scored tenant-specific impact.
- Changes: read-only operational truth SQL and Node regression test, aligned with existing governed paths.
- Production baseline: 156 catalog entries, four with historical observations, zero tenant impacts at previous readback.
- Evidence guard: READY and SCORED impact required; do not invent actions, verified outcomes, or learning.
- Closure: Required + CodeQL + protected merge + exact-main production readback; activate real source adapters and tenant impacts separately.

## Addendum: immutable learning projection recovery

- Historical Required `37742193380`: PASS; CodeQL `37742192989`: PASS; PR #4108 protected merged to `ee9e6b19...`.
- Historical skill projection `37742411908`: FAIL on `LEARNING_EVALUATION_TEST_PATH_INVALID:historical_replay:[object Object]`; code/security gates are not substitutes for canonical learning.
- Canonical terminal replay `37756500341`: correct real CodeQL check PASS, live Netlify descendant `99013007...` with deploy `6ac75fc85b7162000804fedf` PASS, learning projection FAIL, terminal correctly withheld.
- Structural fix: update learning evaluation to existing `tests/brain-source-universe-operational-truth-v1.test.mjs` test paths in historical/shadow/canary; regression rejects historical object-only shape. Preserve same obligation through protected successor rather than override old PR or fabricate a success.
- Completion is contingent on protected Required, CodeQL, merge, new skill projection and terminal evidence; no claim that tenant-specific impact or actual observed sources magically increased.
