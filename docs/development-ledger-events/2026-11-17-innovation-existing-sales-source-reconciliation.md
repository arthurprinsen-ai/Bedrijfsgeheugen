# 2026-11-17 — Native original implementation reused, not regenerated

- Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Existing canonical daily watcher and original source readback: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5977
- Original sales candidate: `55bb0754-355b-4940-aaea-aed7123e7e57`, original operation `edebcb32-335b-49f0-b527-eb4289f95c5c`, Engineering owner unchanged
- Actual historical source: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5857, protected merged with a full 7-day source audit. Follow-ups: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5866 and https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5879
- Original Source evidence already existed with old native production source audit (165 internal events) and `protected_release_verified=true`, but `independent_live_readback_verified=false`, provider send false and original consumer ACK false. It was incorrectly restated as `PROTECTED_BUILD_DUE`.
- Correction: exact original identity + native GitHub merged PR + independently fresh original PostgREST seven-day source event/audit count; only original CAS/GET, no new dispatch or duplicate code.
- Explicit negative gates: stale/partial source, forged PR or wrong owner, original provider unavailable, over-cap, no executions, no external send, no measured paid customer conversion, no independent Heartbeat outcome.
- Automated regression: `tests/brain-innovation-existing-protected-source-reconcile-20261117.test.mjs`.
- Release: protected exact-head Required/CodeQL, merge to main, scoped original delivery recovery job, native original Brain receipt update and independently measured metrics after release. No live status before all gates.
- Rollback: protected revert of additive source code and workflow test invocation; historical original Brain data preserved.

## Exact protected admission regression and repaired source semantics

- The first protected admission for PR #5983, https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44168209008 , correctly rejected `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:semantic_learning`, although the earlier canonical learning historical replay and canary tests both passed.
- Root cause: the learning JSON documented preventive and historical proof context under descriptive keys but omitted mandatory machine-readable `prevention_rule` and `evidence` keys required by the existing material writeback closure guard.
- Fixed in the **same original PR** without relaxing or modifying admission: explicit nonempty prevention rule plus source references, exact regression, protected historical PRs and conservative business-outcome NOT_PROVEN fields. Original technical release and live source-effect readback remain to be verified after protected merge.

## 17 November — protected historical predecessor branch advanced concurrently

- Protected native original PR #5981 merged while current continuity PR #5983 was in Required CI. It verifies merged historical PR #5109 and would otherwise admit the already-protected sales source candidate as a fresh code work order. No source overlap with #5983; GitHub's original branch synchronization preserved all source changes.
- Add original code selector guard for `evidence.protected_implementation_source_evidence` with exact original candidate/owner/revision and protected release URL; do not regenerate PR #5857 or overrule the previous parent's native provider verification.
- Add negative test for five tampered original implementation facts; embed the new regression in original Brain learning historical replay and canary. Existing application owner/operation remains original.
- Release validation remains exact-head Required, CodeQL, original native main merge, and post-merge original recovery readback. No live claim or changed original terminal status before verified.
