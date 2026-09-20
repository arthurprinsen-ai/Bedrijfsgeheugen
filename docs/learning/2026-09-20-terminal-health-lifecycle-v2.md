# Terminal health lifecycle v2 — 20 September 2026

The production readback of v1 exposed two historical artifacts: a 31-August selftest reconciliation that never dispatched externally, and a ten-minute P0 proof whose observation correctly expired on 31 August. Neither is a current production failure, but neither had an explicit lifecycle.

v2 adds explicit retirement semantics to desired-state JSON and excludes only `lifecycle=RETIRED` proof from current runtime health. Historical truth remains stored as stale evidence; no new observation is invented. Current `BLOCKED` obligations plus active `GREEN_STALE`, `DRIFTED`, `UNKNOWN`, stale PLANNED operations or ESCALATED reconciliation keep overall health false.

Old escalated selftests are compensated only when they are still PLANNED, have dispatch_generation 0, no remote_ref and are older than 24 hours. An escalated job with an already terminal VERIFIED/COMPENSATED operation is reconciled to RESOLVED. This closes bookkeeping inconsistency without claiming the external action succeeded.
