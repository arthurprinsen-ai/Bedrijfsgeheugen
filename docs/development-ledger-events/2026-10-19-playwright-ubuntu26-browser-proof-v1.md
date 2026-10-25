# Chromium production proof on Ubuntu 26.04 — recovery and prevention (2026-10-19)

Obligation-ID: `production-browser-readback-ubuntu26-20261019`
Fingerprint: `delivery|playwright-1.55|ubuntu26.04|browser-proof-blocked|20261019`
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4442

## Independent root cause
Three production workflows install Playwright 1.55.0. Hosted Ubuntu 26.04 rejects Chromium for that exact version with `ERROR: Playwright does not support chromium on ubuntu26.04-x64`. GitHub [Portal V2 DOM proof run 39216880329](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39216880329), [Production Source Snapshot 39216880319](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39216880319) and [Production Release Readback 39216880346](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39216880346) all failed on browser installation. Netlify provider nevertheless published the requested commit `d3a73d8816c384c6a745b68178b4691727d31000` on deploy `6ad5c80e404d0a632f2b276d` (READY, 2026-10-19 07:36Z).

## Repair strategy
Pin Playwright 1.61.0, the first official release with native Ubuntu 26.04 support, uniformly across `install-chromium.sh` and the three canonical main-release workflows. Official vendor reference: https://github.com/microsoft/playwright/blob/main/docs/src/release-notes-js.md and https://playwright.dev/docs/browsers . The installer still fails closed and retains Chromium browser verification; there is **no** bypass or synthetic test result.

## Prevention and closure
`tests/brain-playwright-ubuntu26-production-readback-v1.test.mjs` prevents unsupported old pins from re-entering production CI. Exact-head protected Required CI/CodeQL required. Following merge, validate browser install itself and browser route clicks on the published immutable deployment. If a workflow change does not trigger a browser proof automatically, use an **authorized manual workflow dispatch** with a valid merged PR number and exact deployed commit; do not accept a green static check as browser proof.

## Other separately open work
The rest of Decision Twin (independently measured causal effects), unapproved CMS content, financial tenant time series and growth backlogs remain under their own evidence/acceptance gates.
