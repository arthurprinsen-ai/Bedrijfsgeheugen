# Commercial relationship coverage: contact authority review

The existing five-minute POWERHOUSE commercial Heartbeat now calls a bounded contact-authority review before the existing outbound dispatch. It reuses the already deployed connection enrichment state; it never sends or sets approval by inference. Each assessment is stamped with the Europe/Amsterdam business date and preserves evidence of contact signals, suppression, pressure and missing authorization.

## Acceptance criteria

- Existing scheduler remains the only owner; no new CRM, queue, sender or scheduler.
- Process up to 500 not-yet-reviewed canonical contacts per tick and resume on subsequent ticks without duplicate assessments for the same date.
- Suppression is respected. A mere email address or LinkedIn connection does not establish contact consent.
- Existing sender's recipient- and action-level approval, caps, provider readback and deduplication remain mandatory.
- Observed daily counts, real Gmail Sent IDs, LinkedIn DM provider IDs, replies and actual orders must be read back before claiming commercial success.
- This change does **not** grant permission to contact the 605 stored email addresses, nor does it change the existing five/day email cap.

Status: source and regression tests proposed; rollout and live send proof pending.
