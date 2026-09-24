# 2026-09-24 — Powerhouse 50 Problem Radar executive P0

- Fingerprint: `powerhouse-50-problem-radar-executive-p0-v1`
- Obligation: `powerhouse-50-problem-radar-executive-p0-v1`
- Scope: portal / executive cockpit / product intelligence
- Root cause: the canonical Problem Library was live, but the executive start surface still used generic attention objects instead of projecting the same canonical `PH-Pxxx` problem truth.
- Change: executive projection now accepts only canonical `PH-Pxxx` problems, caps the start view at five, normalizes impact certainty to `OBSERVED`, `ESTIMATED` or `POTENTIAL`, and exposes evidence, root cause, first action, capability and outcome in the problem card.
- Evidence: `portal-v2/operating-system/executive-projection.js`, `portal-v2/operating-system/executive-cockpit.js`, `tests/brain-powerhouse-problem-radar-executive.test.mjs`, PR #2779 and its Netlify deploy preview.
- Prevention: never create a portal-local problem taxonomy; invalid local IDs fail closed and unknown impact certainty fails safe to `POTENTIAL`.
- Learning writeback: `brain/learning/2026-09-24-powerhouse-50-problem-radar-executive-p0-v1.json`.
- Completion rule: protected merge to main, production deployment and exact production readback are required before LIVE_BEWEZEN.
