# 14 november 2026 — Canonical daily email: evidence-based source acquisition

## Verified production root cause (07:37 UTC)
- Original cron #112/#113/#114: all seven most recent daily executions recorded SQL success; #132/#133 hourly preflight/reconcile also running. Cron success is **not** mail delivery.
- Existing Gmail/account dry-run: `account_resolved=true`, `account_user_resolved=true`; one prepared candidate, no external send.
- `bg_connecties`: 23,295 connections; 605 nonempty email; 123 `extra.human_approved=true`; only **one** approved candidate also has one of the current commercial-state flags and channel eligibility.
- Last 30 days: 21 `autonomous_email` source-gate `SOURCE_SPECIFIC_EVIDENCE_REQUIRED` (20 expired, 1 prepared). One independently observed recipient-addressed email, 10 November; no proven daily send.
- Current original action `27572918-c809-44c1-8f23-88b8cd24990c` is prepared but blocked. Original same-lineage research dedupe `relationship-research:outreach-source:27572918-c809-44c1-8f23-88b8cd24990c` is waiting after `NO_VERIFIED_SOURCE_IN_BOUNDED_ORIGINAL_SEARCH`, with a 24-hour retry. No Gmail attempt or provider ID. Do not replay a historical sent message to force a daily quota.
- Newsletter is separately `NO_AUTHORIZED_CANONICAL_EMAIL_EXECUTOR`; not fixed by this relationship-outreach change.

## Source-first change
The original `powerhouse_execute_relationship_research_v1` (stage 2 of the **existing** hourly `powerhouse-commercial-learning-v1` cron #116) now seeds at most five additional PUBLIC COMPANY RESEARCH tasks per Europe/Amsterdam day. It reuses `powerhouse_sales_actions` `research_enrichment/internal` and existing `powerhouse-relationship-public-research` Edge provider, downstream signal, composer, Gmail and Brain evidence; **no new cron, queue, executor, contact, consent, or new company evidence** is fabricated. It excludes suppression, negative reply, revoked approval, recently contacted contacts (90-day hold), recent research (30-day hold), email-free contacts, and rejects more than one company per day. Identifiers are idempotent, with the original stage transaction advisory lock.

Priming is **source research only**. It does not make a contact a valid mail recipient, approve a message, raise daily send limits, or bypass the composer / jurisdiction-specific email policy. Existing recipient authorization, independent accepted current company source, human-quality/novelty, global opt-out, Gmail provider ACK and Gmail readback remain hard requirements. A source query without a defensible business trigger is an explicit `NO_ELIGIBLE_ACTION`, not a failed send to replay.

## Acceptance before declaring live
1. Protected CI / BRAIN / CodeQL + Supabase preview/advisors pass; migration applied through canonical release.
2. Read actual `pg_get_functiondef(powerhouse_execute_relationship_research_v1)`; verify priming call; no second scheduler; `cron.job` #116/#112-114 unchanged.
3. After next *natural stage 2*, at most five new uniquely approved internal source records for that local day, with zero `external_side_effect_allowed` and zero provider sends from the source preparation itself. Measure DataForSEO costs.
4. After original provider research runs, verify actual source acceptance or honest negative evidence and 24h bounded retry, then compare original composer gates and any real independently read-back Gmail IDs. Never mark a research `done` as mail delivered.
5. Daily dashboard: total connecties, e-mailadressen, human-approved, suppressions, eligible, researched, verified-business-signal, composer-pass, Gmail sent/readback, replies, meetings, booked and realized revenue; alert on zero eligible or unverified attempted sends. BRAIN / Heartbeat / portal consume the original lineage. Email/niewsbrief states reported separately.

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Existing outreach feedback: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4340.
