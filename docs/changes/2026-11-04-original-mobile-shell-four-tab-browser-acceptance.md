# Original mobile-shell browser recovery — 4 November 2026

## Independent source evidence
The original GitHub Actions [Portal V2 Production DOM Readback #41839564792](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41839564792) on protected head `efb41b489607b2c6d2f7326324682ad0ff772a3b` verified immutable Netlify READY deploy `6aeb29401ec7ec2b37b0ebd0`, published SHA `5f613a1802c9ece6d4023beef1c6a058caf9db22`. **All original 16 production DOM tests gave 15 PASS / 1 SKIP / 0 FAIL**, so canonical company/adoption/CSRD and 390px mobile global action were genuinely browser verified.

A **separate** original `portal-v2-mobile-shell.spec.js` failed 1/1: line 24 still asserted the old `#portalFullMenuToggle` was visible at 390px. The actual mobile-first Portal V2 intentionally hides this duplicate hamburger and exposes the four canonical task-oriented shortcuts **Vandaag, Acties, Resultaat, Meer**. This is a stale accessibility/browser contract, not evidence that the canonical More control is absent. Old 16-suite success must never be presented as overall Portal browser green.

## Correction in original QA source
Update only the original Playwright test to verify hydrated `[data-portal-mobile-primary="v1"]` is visible with four buttons; actual `[data-mobile-primary-target="hub:portal"]` is visible, named Meer, has height >=44px; click to open original `#allPages` in hub `portal`, then close back to native overview and prove old redundant hamburger remains hidden. Retain independent assertions on visible 4-control search row, native action sizing, topbar compactness, customer-demo period, no horizontal overflow, no uncaught browser errors and original screenshot evidence. No production client, alternate router, data, auth/RLS or Netlify security code is altered.

## Canonical verification
Original ONE BRAIN failure via `public.brain_observe_failure`: `portal|ux|mobile-shell-legacy-hamburger-assertion|20261104-v1`, exact provider run 41839564792/job 126607232193, audit learning + test `tests/brain-portal-mobile-shell-actual-menu-readback-20261104.test.mjs`. Protected exact-head Required + CodeQL → original protected merge → **existing original** Production DOM Readback with protected published SHA and approved PR → full browser result. An actual unassisted entrepreneur mobile/VoiceOver usability test is separate and not implied by green CI.
