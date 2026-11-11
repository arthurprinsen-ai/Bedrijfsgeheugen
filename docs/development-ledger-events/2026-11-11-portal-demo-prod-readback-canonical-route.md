# Development ledger — 2026-11-11 Portal V2 canonical production demo bootstrap

- Fingerprint: `portal|prod-readback|legacy-demo-redirect-navigation-race|20261111-v1`
- Owner: original Portal V2 production readback / issue #4215.
- Observation: run 43028996822 15 passed, 1 skipped, 1 failed; page.goto legacy `/klantportaal` redirected to `/portaal/demo` while retry navigation interrupted original redirect.
- Cause: CI used deprecated 301 alias in a repeated browser route probe, rather than the already published direct canonical demo route.
- Fix: one-line original browser test entry change, regression checks preserving all 24 capabilities, three mobile widths and portal state hydration guard.
- Safety: no bypass or relaxation of browser assertions; no production runtime routes, auth, tenant state, provider/scheduler or financial claims altered.
- Acceptance: original protected PR checks, merge, exact Netlify deployment SHA and independent rerun of full production DOM.
- Current status: protected candidate / not yet verified after new merge. Original #4215 and all unresolved business handoffs remain open.
