# Development ledger — real planned-action capture on original paths

- Date: 2026-11-06. Obligation: `delivery|preflight|actual-guard-decision-capture|20261106-v1`, parent issue #5510.
- Root cause: genuine `--action` decisions were not automatically persisted, so no real agent-action recall denominator.
- Change: canonical `loadDeliveryPreflight` callback persists original guard output before blocking; existing `brain_append_record`, provider readback, keyed action digest, unique run/action/ack identity; no raw text or secret retention.
- Safe execution contexts: original PR planner exercises the guard **without secrets**; existing protected-main integrity and release jobs may record through GitHub secrets, never PR heads. Missing credentials is an explicit nonmeasurement.
- Regression: `tests/brain-planned-action-live-recorder-20261106.test.mjs`; `tests/brain-planned-action-trusted-main-capture-20261106.test.mjs`; existing recall and guard regressions. All changes under protected Required/CodeQL/BRAIN.
- Status: CODE_CANDIDATE_UNVERIFIED until protected merge and independent terminal readback. Operational capture counts/recall/fp remain NOT_MEASURED until actual provider events and separately authenticated reviewer evidence; never claim prevention based on a blocked plan alone.
