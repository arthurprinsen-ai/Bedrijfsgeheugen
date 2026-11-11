# Correct canonical Portal V2 demo readback after original Work & Process OS release

Date: 2026-11-11. Fingerprint: `portal|prod-readback|legacy-demo-redirect-navigation-race|20261111-v1`. Original issue #4215; related release PR #5617.

## Observed failure
GitHub [Portal V2 Production DOM Readback run 43028996822](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43028996822), against release `f7aa5af45e5a7da2ee55078324adb60dc891438c`, 15 passed / 1 skipped / 1 failed. The 320/390/430 mobile full parity case failed in bootstrap `page.goto('/klantportaal?klant=demoAI')`: an older 301 redirect to the **existing original** `/portaal/demo` continued during a newer attempt and interrupted navigation.

Production Netlify deployment `6af46cc891e46f47ab9a0d75` is READY and current at this SHA; release identity is verified. The DOM/browser acceptance is **NOT green**, and the failure cannot be suppressed or relabeled. The failure log does not independently prove that a process widget is broken; equally, it cannot prove the 24 checks passed.

## Safe original recovery
Use the original `/portaal/demo?klant=demoAI` route (already 200-rewritten by canonical `_redirects` to `/portal-v2/`) for test bootstrap. Do not use the legacy `/klantportaal` 301 alias for repeated browser navigations. Keep all 24 capability, mobile width, overflow, hydration and saved-state probes unchanged. One focused regression enforces the canonical entry and test breadth.

No business logic, website CTA, price/checkout, Supabase, auth, migrations, provider, scheduler or production router changes. Protected Required/BRAIN/CodeQL must pass, protected merge, then exact main Netlify READY and **fresh independent** full Portal V2 production DOM browser readback must pass. Even a green browser run is not evidence of two real authenticated customer tenants, authorized workflow approval, ONE BRAIN/Powerhouse/Heartbeat receipt/outcome or Red Dot award.
