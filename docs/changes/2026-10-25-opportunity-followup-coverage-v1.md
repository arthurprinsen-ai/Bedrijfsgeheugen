# 25 October 2026 — Canonical opportunity follow-up coverage

## Problem observed in production
837 commercial opportunities are open; 618 have no `next_action_at`, 219 are overdue, and zero are future-scheduled. The historical sales action register also contains 6,808 expired items. This is a **scheduling/coverage gap**, not evidence of 837 reachable buyers or 837 qualified sales leads.

## Minimal change, no parallel growth system
The existing daily Netlify `growth-intelligence-daily` uses the canonical Brain commercial qualification logic and Supabase tables. One bounded planner generates up to 24 **internal review** obligations per daily cycle in existing `revenue_learning_obligations` and guarded next-action timestamps in `powerhouse_opportunities`. Stable obligation keys prevent duplicating tasks. Review/action classifications, privacy restrictions and source evidence remain visible. Missing qualification continues to count as uncovered.

## Commercial truth and safeguards
A planned internal research action is not a delivered outreach, lead, meeting, order, or payment. A social like, anonymous returning visitor, or third-party signal does not authorize contacting a prospect. A suppressed contact is never selected for external messaging. A provider-concurrent update to a newer next action must not be overwritten; guarded writes occur only after the existing opportunity upserts flush.

## What this does *not* implement
The code does not automatically edit website copy, measure session-level reasons for abandonment, perform a LinkedIn/Instagram action, send emails, or prove revenue. Those responsibilities remain with their existing provider-governed agents and obligations. Website CTA event-count consistency (22,284 page views vs 1 primary CTA click in 28d) requires a separate instrumentation/readback check before treating missing clicks as human behavior.

## Acceptance
Run the new planner regression and amended existing integration regression through learning canonicalization and Required, then CodeQL and applicable delivery checks on the exact candidate head. Release only by protected merge with production readback of future-dated opportunities and durable obligations. Source: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4895.
