# P0 Gmail: recipient authorization must come from the matching CRM source

Canonical obligation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Live diagnosis before this candidate
On 8 October 2026, canonical v5 NBA/command-center had 610 opportunities, 102 with email addresses but zero email-channel recommendations. The `bg_connecties` CRM had 605 records with an email, but none had `extra.human_approved=true`; `verbonden_op` denotes a LinkedIn connection date, **not** marketing consent. No approved eligible recipient send exists to canary. Two independently proven public publications only meet the separate publication SLA.

The existing Gmail sender checked suppression and message composition but trusted candidate preparation: the code had no final source-authority readback of a recipient-specific approval before `GMAIL_SEND_EMAIL`. The `dry_run` path also called the composer and message-plan refresh before answering.

## Narrow change on existing executor
- For every prepared email action, re-read the matching `public.bg_connecties` CRM record for **exact email**, **matching person identity**, and affirmative `extra.human_approved=true`. Also require the action's affirmative `evidence.human_approved=true` derived at preparation time. A missing row, changed approval, mismatched recipient, or DB read failure blocks provider sending.
- A LinkedIn connection, existing address, generic authenticated scheduler or inferred relationship does not grant direct-message authority. Human approval must be based on an independently documented lawful outreach basis; no automatic flag creation.
- Keep the action `prepared` and write a typed, explicit `RECIPIENT_AUTHORITY_UNVERIFIED` hold with `contact-permission-verification` owner. This is a repairable source-data gap, not a fabricated provider failure or permission grant.
- Move `dry_run` before the mutating composer and plan refresh. Report authorized versus unapproved prepared actions without any send or write.
- Preserve original single scheduler, Gmail executor, suppression, pressure, cooldown, message-quality gate, provider SENT readback, outcome lineage and duplicate-send quarantine.

## Security and production proof boundaries
Existing-state-first: no new cron, parallel sender, consent inference, email addresses, automatic approval mutation, synthetic external response or changed contact-pressure thresholds. This source candidate alone does **not** prove an actual send or full autonomous commercial closure. Protected merge, CodeQL, Required, deployed Edge bytes readback and real authorized canary are distinct. Keep #4198 open until downstream provider outcomes and learning evidence are verified.
