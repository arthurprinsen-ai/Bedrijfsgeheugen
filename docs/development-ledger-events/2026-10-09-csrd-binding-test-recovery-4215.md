# Development ledger — CSRD source contract repair

- P0: #4215; parent PR #4225, merged main SHA `8d8abeffcbd65a1577d67ca59e45295b6c69f5e0`.
- Required PR workflow `37888732040`: Portal V2 job `113684751128`, failing step `Verify Portal V2 contracts`, failing subtest #159 at `portal-v2/tests/csrd-state-binding.test.mjs:34`.
- Defect: fixture regex assumed a single argument to `impactSnapshotFromPortalState` and failed on explicit tenant-safe `{demo:...}` parameter. Actual function/source replacement is already present.
- Fix: update exactly the stale assertion and add explicit demo guard to source-check; native Netlify heartbeat preserves current-main release parity.
- Required before closure: fresh exact-head portal regression, CodeQL, protected merge, exact main production readback. External CSRD applicability and two actual authorized tenant sessions remain independently open.