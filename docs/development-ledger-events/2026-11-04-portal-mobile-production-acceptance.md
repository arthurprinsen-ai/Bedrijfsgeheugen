# Portal mobile UX: technical production acceptance and evidence boundary

Date: 2026-11-04
Owner: original Portal V2 UX/Engineering and canonical release owner
Status: TECHNICAL_PRODUCTION_VERIFIED; HUMAN_USABILITY_OPEN
Fingerprint: portal|mobile-ux|dialog-loses-route-and-focus|20261104-v1

## Immutable evidence
- Mobile fix PR #5423: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5423
- Release fix PR #5425: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5425
- Published commit: 4d5823446c3b830e9b33b0314893cdd56dc5b5ee
- Netlify production: https://app.netlify.com/projects/bedrijfsgeheugen/deploys/6aeb82327b0f598f2a87721a — READY, published 2026-11-04T19:08:09.915Z
- Original production browser: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41895447111/job/126804497371 — SUCCESS; 15 production checks, 1 hydrated mobile-shell check, 1 production visual regression and regenerated approved-source baseline.

## Root cause and prevention
A duplicate unpinned ES-module router instance in an earlier browser test invalidated the real navigation check; specialist overlay could remain open behind the full menu. Preserve bound original DOM navigation and close specialist overlay before opening the sole menu. Test focus trapping, inert state, keyboard exit and original route on actual hydrated 390px browser; require exact-SHA production readback.

## Outstanding evidence
Unassisted first-time entrepreneur usability, physical VoiceOver/TalkBack, and WCAG 2.2 AA audit are NOT proven. Keep separate acceptance records and do not label them green until real observations and accessibility evidence exist.

## Learning and governance
Original owner only; protected checks and merge; no parallel execution. On failure log fingerprint, source, root cause, owner, remediation, regression, release evidence and preventive rule in ONE BRAIN and portal. This record documents verified facts, not a claim that human testing has occurred.
