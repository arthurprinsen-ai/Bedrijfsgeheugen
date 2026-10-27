# Development ledger — 2026-10-19 — brand-shell browser-runtime recovery

- Obligation-ID: `brand-shell-ubuntu26-playwright-20261019`
- Source: GitHub workflow run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39294416171 and upstream https://github.com/microsoft/playwright/issues/40117
- Observation: production shell / SEO / growth endpoints passed readback on commit `3404f09a26db4fe1d787ced2eb65dda178b70878`; subsequent actual visual Chromium installation failed with the precise Ubuntu 26.04 platform support error. This was not a website visual PASS.
- Root cause: the existing `Canonical brand shell live readback` workflow pinned Playwright 1.55.0 while the shared installer default already used supported 1.61.0. Repeated apt retries could not repair unsupported browser binaries.
- Action: replace only the workflow override 1.55.0 => 1.61.0 and add `tests/brain-brand-shell-ubuntu26-playwright-20261019.test.mjs`, documenting unchanged real visual readback and diagnostics gates.
- Prevention: reject stale browser version override before dispatch; run the historical replay regression through canonical Brain learning and CI. No weakening of website safety gates and no shadow production deployment.
- Current status: candidate only. Protected release, CI, visual evidence and production-readback must occur before LIVE_VERIFIED; do not infer success from this append-only ledger.
