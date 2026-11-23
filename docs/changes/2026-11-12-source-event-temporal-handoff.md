# Powerhouse → ONE BRAIN → Heartbeat: metric event and its timestamp are ONE proof

12 November 2026, original incident #4198, existing canonical cron #171.

## Production defect, independently reproduced

The existing Windsor.ai `linkedin_organic` connection returned genuine as-of 12 Nov 14:12:23Z organization statistics with exact identity for three original company posts from 9–11 Nov. Existing `social_posts` and `content_publication_obligations` confirmed the same company/author, provider ID, first-party published receipt and canonical URLs. Three uniquely source-bound metric snapshots were appended to the ORIGINAL `social_metric_snapshots` source (1, 1 and 4 impressions), with genuine Windsor fetch timestamps and no backdating or fabricated missed 24/48/72h obligations. The original #171 consumer changed all three from WAIT_MEASUREMENT to WAIT_ANALYSIS.

**Root defect:** in original `powerhouse_content_handoff_receipts_v1`, `measurement_consumer.accepted=true` and `source_event_id` referred to the newest Windsor snapshot, but `measurement_consumer.measured_at` read the old publication obligation column, which for 10–11 Nov was NULL and for 9 Nov was from a DIFFERENT older snapshot. This breaks producer-consumer evidence integrity even when there are zero unmirrored BRAIN obligations.

**Permanent correction:** read `s.source_event_id,s.observed_at` as one query row from `social_metric_snapshots`, reset per original publication, emit consistent `accepted`/event/timestamp/producer provenance. When `WAIT_ANALYSIS` or `OVERDUE_ANALYSIS`, the BRAIN `next_action` must address the existing BRAIN analysis consumer, not ask for provider collection again; preserve `source_next_action` unmodified.

**Truth bounds:** original 24/48/72h window debt remains without genuine matching observations. Timestamp of Windsor fetch is not historical post publish time. No new scheduler, duplicate sender, unverified OAUTH, fabricated experiment winner or revenue. Original security `service_role` only.

Paths: `supabase/migrations/20261112162500_original_metric_source_temporal_handoff_v1.sql`, `tests/brain-original-metric-event-temporal-handoff-20261112.test.mjs`, machine-readable learning, shared AGENTS.md and original Powerhouse social CRO skill. Required + CodeQL, protected merge, native migration and actual original BRAIN re-readback must pass.
