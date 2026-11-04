# Portal V2 mobile UX — verified production closure and open human acceptance

2026-11-04 · Original owner: Portal V2 UX/Engineering · Status: TECHNICAL_PRODUCTION_VERIFIED; HUMAN_USABILITY_OPEN.

## Problem and root cause
Original mobile menu could overlap the specialist overlay; an unpinned dynamic ES module import in a browser test instantiated a second router rather than exercising canonical bound DOM handlers. This caused misleading navigation verification.

## Corrective action and prevention
PR #5423 corrected original router/overlay/focus behavior and 390px Playwright regression; PR #5425 corrected Netlify release SHA resolution without relaxing deployment integrity. Existing owner and original writer remain authoritative; protected checks, immutable production SHA and original Chromium readback are mandatory for future releases.

## Independently verified production outcome
- Netlify deploy 6aeb82327b0f598f2a87721a published 4d5823446c3b830e9b33b0314893cdd56dc5b5ee on 2026-11-04T19:08:09.915Z.
- Original production-dom-readback run 41895447111 / job 126804497371 completed SUCCESS: 15 production DOM/router tests, one hydrated mobile-shell test, one approved-source visual reference, one production visual comparison.
- Learning fingerprint: portal|mobile-ux|dialog-loses-route-and-focus|20261104-v1. Brain record: brain/learning/2026-11-04-portal-mobile-production-acceptance-v1.json. Historical replay and canary: tests/brain-portal-mobile-production-acceptance-v1.test.mjs.

## Explicitly not yet proven
Unassisted first-time entrepreneur usability, physical VoiceOver/TalkBack, and independent WCAG 2.2 AA audit remain OPEN. Technical test success does not imply a human usability result. Observe task completion, errors, time and comprehension before declaring those criteria green.

## Governance
Log every future regression with fingerprint, original owner, cause, source evidence, tested remedy, protected release, provider readback, prevention and user-facing documentation; do not create parallel executors or bypass admission gates.
