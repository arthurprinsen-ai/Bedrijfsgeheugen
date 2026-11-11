# Development ledger — one-loop process replanning (2026-11-11)

- Fingerprint: `portal|process|owner-deadline-cannot-replan-without-dropping-lineage|20261111-v1`.
- Owner: original Portal V2 customer deliveryPlan writer; parent #4215, related #4198.
- Verified source gap: process creation had mandatory owner/optional target date, but no in-place edit route for changing them.
- Change: `reviseProcessPlan` in original pure process model, one existing view form and UI binding, preservation of explicit step ownership and all submitted/approval evidence, responsive styles.
- Handshake: writes continue only through original board `persist` → `domainState.set('portal.deliveryPlan',state)` → authenticated DomainState and BusinessInput → independent server ACK; no fake receipt on form submit.
- Tests: `portal-v2/tests/process-portfolio.test.mjs`, `tests/brain-process-replan-20261111.test.mjs`, protected CI and production verification required.
- Unresolved: independently authorized approval, provider action, verified customer outcome, Heartbeat effect and actually applied learning; original #4215 stays open.
