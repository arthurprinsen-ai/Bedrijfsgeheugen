# Development ledger — 9 October 2026 canonical content-loop recovery

- Obligation: `content-publication:2026-10-09:canonical-closed-loop`; parent P0 #4198.
- Production observed at 09:22 UTC: 0 provider-proven publications and 0 commercial recipient emails, canonical day `degraded`.
- Existing job #140 only invoked one heavy orchestrator attempt daily; the canonical closed-loop tick function existed but had no active cron caller.
- Production SQL migration `20261009092942` successfully altered existing #140 to run the canonical tick at minute 27 hourly during the business day; readback verified active job and command. No new cron.
- Existing Edge supervisor was modified on a protected branch to drain at most four decided content candidates per tick and detect absent progress before dispatching already-prepared artifacts.
- Current distinct unresolved boundaries: Groq fallback provider restricted by overdue payment; LinkedIn company global story duplicate; Mira reel final asset missing; newsletter has no authorized canonical executor and no proved eligible recipient send.
- Status: source candidate is NOT production-proven. Preserve all provider truth and suppress duplicate sending while CI, protected merge, runtime readback and true public publication IDs remain open.

- Subsequent preview breakthrough: duplicate unmerged SalesRobot ingress #4237 closed; Supabase removed its empty ephemeral preview. Native reopening of the same #4254 created provider-owned branch `bwuygnjnwlrwywzsmzvh` without increasing branch quota or creating another content writer.
- Provider check #113800836089 failed on isolated preview with `EXISTING_CANONICAL_CONTENT_JOB_NOT_FOUND`: migration replay assumed production cron #140 row existed in fresh branch. Same canonical migration updated to explicit absence no-op / preserve existing-only alter, and existing regression test extended. Exact-head Supabase provider success and protected release remain unproven until repeat validation.
