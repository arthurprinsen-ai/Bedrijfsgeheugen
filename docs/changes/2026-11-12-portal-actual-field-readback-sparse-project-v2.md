# Portal V2 per-field readback + sparse external record (2026-11-12)

Original protected #5671 fixed the portal projection's missing/stale acknowledgement, preserved canonical Brain BusinessInput. But its `createPortalStateClient.write` only tests that GET is authenticated; a stale customer input value can still display 'saved'. Separately, `project-state.js` creates empty array defaults on incomplete provider records and overwrites user-authored project/todo/docs/source fields in customer view.

Keep original #5671 strict ACK and auth, add recursive exact authored `portal.*` field comparison; explicitly measured zero and null are distinct. Post-GET differing values fail closed with `PORTAL_STATE_VALUE_READBACK_MISMATCH`; no duplicate browser store. External project provider overlays only the actual declared task/roadmap/docs/integration/note/activity arrays and project-specific fields; missing data is not `[]`. Existing tenant ownership remains authoritative.

Original tests, standalone Brain historical/shadow/canary, Portal Living Interface skill, AGENTS policy, human ledger. Protected exact-head Required/CodeQL/Netlify current/readback mandatory, then genuine authorized customer 200-field / 2-tenant runtime signoff. P0 #4215 and source proof from original external Universe remain open. No new scheduling/connector or fabricated metrics.
