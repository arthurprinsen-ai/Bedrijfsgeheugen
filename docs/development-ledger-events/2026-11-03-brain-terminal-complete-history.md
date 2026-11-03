# 2026-11-03 — original terminal paginated singleflight repair

- **Incident:** #5338, parent #5332.
- **Fingerprint:** `github|brain-terminal|first-100-run-bounded-history-blocks-exact-verification|20261103-v1`.
- **Provider evidence:** merged PRs #5336 and #5334, original terminal runs 41593213494 / 41593829735, exact failure `BRAIN_FLIGHT_HISTORY_BOUNDED_UNPROVEN` exit 78. Required and CodeQL were already successful.
- **Cause:** first 100 native BRAIN workflow_dispatch runs were insufficient to prove the absence of a new exact-head run within 343+ historical runs. Fail-closed behavior prevented duplicate but blocked both terminal closures.
- **Safe correction:** native full GitHub pagination, exact count and ID validation, two full read-only snapshots, one original authorized dispatch only if complete evidence proves absence; non-cancelling verification-only and all security gates retained.
- **Learning:** `brain/learning/2026-11-03-brain-terminal-complete-run-history-v1.json`; original continuity skill; test `tests/brain-terminal-canonical-verify-only-dispatch-20261102.test.mjs`.
- **Status:** protected candidate, **NOT LIVE** until native Required/CodeQL/BRAIN and actual original terminal runs independently confirm both complete. No fabricated resolution of provider archive 403, four ghost runs or drift.
