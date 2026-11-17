# Development ledger — original composer fairness, 17 November 2026

**Obligation-ID:** `powerhouse|commercial|composer-email-fairness|20261117-v1`
**Parent issue:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
**Original production owner:** commercial Heartbeat / original composer. This is not a second agent or sender.

## Observed failure
PR #5939 guardian deployed to original Supabase and produced one safe alternate approved candidate. The natural #171 guardian tick at 09:16Z continued to report DEGRADED and two source-held actions. Canonical commercial Heartbeat continues original composer dispatch every five minutes; however the original candidate view's priority order selected five LinkedIn-DM actions (including a very old priority 1020 waiting action), with *zero* email. Two prepared emails remained below selection, despite a 14-row candidate pool.

## Safe change
Patch the original `powerhouse_commercial_message_candidates_v1` ranking, using existing per-channel eligibility/pending gates and at most two reserved email slots per composer batch. DM slots remain available; no new cron, Edge endpoint, send, consent inference, source fabrication or provider fallback. Limit and explicit channel/action filtering preserved.

## Acceptance / independent proofs
- New unit regression and original SQL migration tested in preview.
- Protected exact-head Required, CodeQL, Supabase Preview and release.
- Production native SQL function parity and read-only top five check show email included, plus DM still served.
- Original composer first evaluates exact email action and records SOURCE_SPECIFIC_EVIDENCE_REQUIRED or verified approved quality; do not equate candidate inclusion with send.
- Only independent Gmail provider ID/readback plus outcome on same action can prove delivery.
- P0 remains OPEN until genuine verified end-to-end actions.

## Prevent recurrence
A top-N single global score sorter with mixed-channel age/priority values can starve a valid channel even while all crons are green. Test lane fairness against skewed candidates and reserve bounded capacity; classify true source holds separately from scheduler or provider failures.

No direct production hotpatch; rollback protected PR.
