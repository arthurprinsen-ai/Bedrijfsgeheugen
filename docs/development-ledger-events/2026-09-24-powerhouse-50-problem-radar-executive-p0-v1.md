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

## Terminal closure

Status: `LIVE_BEWEZEN`.

- Feature PR: #2779
- Feature merge: `53c1c5db7a6e499f3afa4a5d9b470e6196460579`
- Closure/recovery PR: #2781
- Closure merge: `b9e129ee972b990681d7e426f023cd25f75036cd`
- Current protected main at final chat closure: `945febc5cb2d603dfaefcc8b1d12a36b075a7d1d`
- Netlify production deploy: `6ab5417a7533790008782b04`
- Netlify state/context: `ready / production`
- Netlify `commit_ref`: `945febc5cb2d603dfaefcc8b1d12a36b075a7d1d`
- Production URL: https://www.bedrijfsgeheugen.nl
- Exact deployed source includes canonical PH-Pxxx filtering, max-five executive problems, evidence drawer, impact certainty labels, action/capability/outcome mapping.
- Subsequent production main also contains Outcome Ledger / Verified Value Created by canonical problem (#2786), extending the same lineage rather than creating a parallel taxonomy.

The prior completion rule is therefore satisfied.

