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
- The cockpit itself remains an observability/override surface. Automatic execution is allowed only through the separate canonical `linkedin-cockpit-autopilot-v1` contract in `powerhouse-social-publisher`: currently only evidence-backed `reply_post` actions with a concrete LinkedIn post URL and final message text. LinkedIn DM and connection activation remain fail-closed capability exceptions unless an authorized provider capability is proven.
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


## Cockpit autopilot production contract — 2026-09-24

Fingerprint: `linkedin-cockpit-autopilot-capability-bounded-execution-v1`.

- Reuse the existing Revenue Command Center; do not create a parallel automation cockpit.
- The canonical executor is `powerhouse-social-publisher`, not the browser cockpit and not Buffer.
- The existing `powerhouse-content-closed-loop-v1` scheduler is the recurring execution trigger; do not add a second cron/task for the same queue.
- Auto-execute only `reply_post` when a concrete LinkedIn post URL plus final `message_draft` exist.
- Atomically claim `suggested -> dispatching` before any provider side effect.
- A returned provider comment ID is irreversible for dedupe: set `republish_forbidden=true`; any later writeback problem becomes `reconciliation_required`, never `suggested` again.
- `reply_dm` and `activate_connection` are capability exceptions until an authorized LinkedIn/Composio action is proven; never substitute scraping or browser bypasses.
- Successful provider acknowledgement must be written to canonical action evidence and `powerhouse_record_outcome`.
- The runtime contract is production-proven on `powerhouse-social-publisher` v49, SHA-256 `d7def61407cf27081a02bc0452c3b506a504e32e0051c86c09c97fc6285d6bf1`, protected merge `350f90eb9b2c76a715530836a7d9c485c2ccdd42`.
- A no-op live canary is valid when there are zero eligible `reply_post` actions; never manufacture a public LinkedIn interaction merely to prove the automation.
