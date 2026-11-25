# ONE BRAIN Trusted Advisor stage-receipt guard — 2026-11-12

- **Original issue:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215; commercial parent https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- **Incident fingerprint:** `portal|trusted-advisor|code-release-not-customer-processed-ack|20261112-v1`
- **Actual public release proof:** exact Netlify source SHA `839086756f2559b9abeb8decc8d945e2f0a3d919`, merge of canonical site-shell fixes, live public readbacks of contact/EN-contact/frisse-blik/zelfscan.
- **Customer/runtime deficit:** read-only `portal_state_layers` has one layer with old source timestamp; seven-day commercial scorecard DEGRADED with seven unproven handoffs. No real authenticated present-day tenant source-revision-to-consumer-processed-ACK independently established.
- **Root cause:** software delivery status and tenant end-to-end business truth were separate evidence domains but customer-facing Trusted Advisor assurance lacked an explicit distinction for source freshness and each consumer stage.
- **Same-owner correction:** original 14-agent governance specialist task/playbook; extend existing trusted-advisor policy and editorial skill with stage checks; one replay/canary regression test.
- **Prevention:** never show ALL_GREEN from code-only production; every original customer revision remains EVIDENCE_DUE until exact tenant/revision/idempotency/owner processed ACK and independent action/effect/learning receipts.
- **No shadow infrastructure:** no new agent, job, scheduler, database, writer, CRM or direct publication.
- **Candidate status:** protected CI and exact new production readback pending; production release completion does not by itself resolve seven commercial gaps.
