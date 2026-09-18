# LinkedIn Sales Cockpit — Predictive v2

Status: **LIVE_PROVEN**  
Fingerprint: `linkedin-sales-cockpit-predictive-sales-os-v1`

## Purpose

Use the existing Powerhouse Revenue Command Center as the canonical LinkedIn sales operating surface. Do not create a parallel CRM, queue, cockpit or separate sales brain.

## Mandatory operating rules

- Start from the canonical revenue action queue and reuse existing opportunity, relationship, forecast and outcome data.
- Optimize for **who now, why now, what action, what evidence, expected value** rather than passive dashboard reporting.
- Predictive fields such as buying-window heat, relationship warmth, company intent and forecast probability may only be shown when they come from canonical evidence.
- A generic LinkedIn feed URL is never actionable evidence.
- No automatic send from the cockpit. Human execution remains explicit unless a separate canonical automation contract authorizes the action.
- Every meaningful action outcome must flow back into the existing Revenue & Growth Core so future ranking can learn from replies, meetings, offers, orders and observed revenue.
- Prefer a small high-value queue over an unbounded activity list.
- Preserve fast interaction patterns: search/filter, focus on top action, keyboard navigation, copy-ready text and direct concrete source opening.

## Production identity

- PR: `#2082`
- Candidate head: `ab88c26eecbc680130a00d538ebfe5894d97b243`
- Protected merge: `54ab849124e4d9d9bde498e998c50d8865c9712c`
- Netlify deploy: `6aad09ac00d5f50008121b25`
- Production commit_ref: `54ab849124e4d9d9bde498e998c50d8865c9712c`

## Delivery learning

The first candidate (#2078) proved an important control-plane boundary: editing PR metadata after a `pull_request` event does not rewrite that event snapshot. If fresh synchronize semantics are not available and main moves, preserve the obligation but create exactly one superseding recovery candidate from current main, then close the stale candidate.

Terminal success requires production deploy identity/readback. Merge alone is not proof.

## Reuse checklist

When extending this cockpit:
1. Read the current Revenue Command Center implementation and canonical sales intelligence first.
2. Reuse existing fields and outcomes before adding a new store or score.
3. Add only evidence-backed predictive context.
4. Preserve no-auto-send and concrete-source requirements.
5. Keep new interactions keyboard/mobile friendly.
6. Add regression coverage.
7. Deliver through protected merge and verify exact production commit_ref.
8. Write outcome/learning/prevention back into Powerhouse.
