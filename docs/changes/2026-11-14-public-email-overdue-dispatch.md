# Original Powerhouse historical public-email source retry dispatch — 14 Nov 2026

Parent P0: [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198), ONE BRAIN original obligation `43c90754-3fd0-4c97-bb14-fbf815e12f47` OPEN.

## Exact pre-existing fault
SQL `powerhouse_dispatch_relationship_public_research_v1(date)` in original #116 commercial pipeline decides Edge dispatch from (1) pending research actions and (2) eligibility for at most eight **new** daily public-domain source tasks. Existing public-domain source records have `status='done'` and a separate `public_email_next_attempt_at`. When eight new slots are used, pending normal research count is zero and an older failed source has become due, original dispatcher returns `NO_DUE_ORIGINAL_SOURCE_RESEARCH`; the original Edge retry code is never called. No source data disappears, but due work can remain unprocessed. Source status and retry must not silently vanish behind a daily quota.

## Change within one original commercial chain
- Protected forward-only SQL migration `20261115001500_original_public_email_overdue_source_replay_dispatch_v1.sql` updates only the original dispatcher. It explicitly checks due existing public-domain research actions even when all eight new source slots have already been consumed. It accepts only valid original ISO timestamps and safe source-only records, and dispatches exactly the existing Edge with its existing scheduler token.
- Existing original #116 cadence, original #138 identity graph/ONE BRAIN candidate receipt, next Heartbeat/NBA, consent/suppression and provider readback remain unchanged. No new cron, queue, paid service, email sender, RLS, role or provider authority.
- Original Reliability agent and daily enrichment skill own the due-work handoff, with current-day/historical retry and original action correlation preserved. No fake source address, no sending from public email discovery alone.
- Regression `tests/brain-public-email-overdue-dispatch-20261114.test.mjs` enforces due-retry dispatch even if daily new-source quota reached and rejects new worker/sender.

## Required protected evidence
Exact-head Required admission, backend/learning, CodeQL, native Supabase Preview and protected merge. Only after actual native migration readback must original #116 natural dispatch prove `due_original_retry=true` for a real due action; original Edge must retry the exact action, record source-page readability and its own health/no-source disposition, and original #138 may acknowledge `PROCESSED` only for an actual person-specific business-mailto candidate. Keep #4198 and original BRAIN obligation OPEN until downstream Heartbeat and outcome proof. Source-lock history is appended only by the existing original provider-authorized source-lock reconciliation after observed native application.

No claim of public address acquisition, consent, actual sending, or revenue is made by this SQL repair.
