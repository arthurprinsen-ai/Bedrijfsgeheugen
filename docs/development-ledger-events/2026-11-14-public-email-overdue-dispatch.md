# Development ledger — original work-email retry dispatcher

- **Date:** 2026-11-14 (Europe/Amsterdam)
- **Fingerprint:** `powerhouse|contacts|original-public-domain-source-retry-masked-by-daily-cap|20261114-v1`
- **Owner:** original Powerhouse commercial #116 dispatcher, #138 independent identity consumer, #171 ONE BRAIN runtime
- **Problem:** existing `done` source research actions with due `public_email_next_attempt_at` are excluded from `v_pending`, while the fresh source cap of eight can disable `v_first_party_due`. The old dispatcher can wrongly report no due source research and strand original retries.
- **Observed production context:** 23,295 connections, 605 existing addresses, eight original safe source retries with earliest due 2026-11-14T23:12:44.234Z; no confirmed candidate or consumer ACK
- **Recovery:** reuse exact same SQL dispatcher and existing Edge, include a bounded read-only boolean for any valid due original action; retain 8 new-action cap, no second scheduler
- **Regression:** `tests/brain-public-email-overdue-dispatch-20261114.test.mjs`
- **One-chain handoff:** original due action → existing #116 dispatcher → existing Edge original action_id → real first-party source status / candidate INGEST → original #138 identity consumer PROCESSED → original ONE BRAIN/Heartbeat NBA → independent effects/learning
- **Security:** service_role execute only, unchanged existing vault token; no personal email guesses, mass mailing, unauthorized provider, RLS, paid lookups or duplicates
- **Acceptance:** protected Required + CodeQL + Supabase Preview, merged main, native provider SQL body readback, natural original #116 due response and independent #138 consumer if real candidate exists
- **Status:** CODE_CANDIDATE_NOT_YET_LIVE; original P0/open obligation must remain actionable until independently measured completion
