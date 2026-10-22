# Development ledger event: ci-brain-archived-source-batch2-20261022
- 2026-10-22: historical SQL source contract drift, observed in BRAIN run 39671036043
- Scope: 10 test files; 12 obsolete path references; 10 immutable archive identity checks
- Root cause: tests retained executable migration paths after repository-only archival
- Production impact: none; candidate test and governance only
- State: NOT_YET_ACCEPTED, no claim of zero BRAIN failures
- Acceptance: exact-head Required CI, CodeQL and independent full 0-failure BRAIN
- Dependencies: #3742 clean-room replay; #4215 authenticated two-customer validation

- 2026-10-22: three old exact-history migration-length assertions made append-aware with fixed historical prefix positions (568/603/607 out of current 634). No migration edits. Full BRAIN 346/3531 on preceding commit, next exact-head acceptance pending.

- 2026-10-22: batch 3: 8 archived SQL contract test readers repaired, 8 obsolete source refs replaced; existing positive/negative test assertions preserved; independent full BRAIN pending.
