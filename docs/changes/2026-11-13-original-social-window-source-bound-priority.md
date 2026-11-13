# 13 November 2026 — original source-bound social-window selection, no alternate scheduler

## Original incident

Original ONE BRAIN P0 [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). Read-only production showed 365 open content handoffs, including 184 original social-learning: 143 `UNVERIFIED_OR_PARTIAL_WINDOW`, 36 `MISSED_OBLIGATION`, 5 other original source debt cases. All 143 partial cases have their actual original posts and snapshots. Although 81 have some historical numeric impressions, **none** has an exact qualified numeric observation matching the actual 24/48/72h ±6h provider time window. Seven raw time-near snapshots are partial-scope only, e.g. personal LinkedIn `reactions_only`; not comparable reach/exposure. This backlog cannot be safely closed using old unrelated daily provider snapshots, and an hourly cron `SUCCEEDED` is not a validated measurement.

## Defect and fix on the SAME ONE BRAIN owner

The **original** `supabase/functions/_shared/social-learning-due-evidence.mjs` marked `hasWindowSnapshot=true` when any numeric `post_id`-matching snapshot appeared within a loosely clamped `toleranceHours` (up to 12). It did **not** bind the original tenant, source event identifier, or external provider post identifier before ranking the original hourly evaluator. An invalidly associated snapshot could therefore monopolize a fair evaluation slot while the already strict `verifiedSocialWindowAck` rightly refused receipt. A wrong-source timestamp could be wrongly prioritized without becoming a valid actual outcome.

Replace only the original priority selector and **same existing** `social-learning-store` scoped snapshot SELECT:

1. Select original `tenant_id` alongside original 900-row capped source records.
2. Require exact `tenant_id` and `post_id`, non-empty `source`, and original `source_event_id` bounded by `:<exact external provider id>:`; do not rely on substring matches of a different post.
3. Preserve `isSourceQualifiedSocialSnapshot` quality and actual finite nonnegative numeric evidence; preserve zero as genuine observed zero; partial-only and metadata-only cannot pass.
4. Strictly cap 24/48/72h observations to actual source `observed_at` ±6h, even when callers request 12h. Zero tolerance must remain zero.
5. Keep the existing original `social-learning-evaluate.mjs` schedule, no new cron, writer, provider call or send. The original final BRAIN ACK remains stricter than the priority hint.

Negative/positive regression is added to `tests/brain-social-learning-observed-window-priority-v1.test.mjs`. The existing skill and machine learning/incident/ledger carry the prevention rule. Old 184 remain OPEN without exact proof.

## Acceptance and status

Candidate until original exact-head Required, CodeQL, native Supabase preview, protected merge, exact Edge deployment SHA/readback and natural hourly original evaluation + original consumer-ACK. This source-bound **priority** fix improves future reliability; it does not create the missing historical snapshots, authorize OAuth, prove independent learning applications, publish posts or generate revenue. Underlying source acquisition at original provider #177 remains separate active recovery requirement.
