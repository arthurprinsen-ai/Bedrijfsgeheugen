# 2026-10-20 — SalesRobot closed-loop ACK vs inbox receipt
- Parent P0 #4198: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Failure: successful send adapter response previously set DM `done` immediately; no independent provider inbox readback, no linked outcome, CRM contact approval absent.
- Canonical historical evidence: 5 `salesrobot_linkedin_dm_sent` events with inbox message IDs, prospect IDs, actual provider readback/sent-by-me proof.
- Fix candidate: no DONE on ACK, keep waiting/no resend, reconcile only exact independently verified inbox event + deduplicated outcome, enforce recipient CRM authorization.
- Safety: zero new outgoing DMs; external SalesRobot expired/disconnected; do not auto-approve 23,295 CRM contacts.
- Acceptance: tests/brain-salesrobot-linkedin-readiness-v1.test.mjs + protected CI, preview, merge, prod source readback, real auth provider proof only later.
