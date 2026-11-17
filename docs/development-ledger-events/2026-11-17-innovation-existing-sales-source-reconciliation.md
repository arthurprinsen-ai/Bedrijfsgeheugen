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
