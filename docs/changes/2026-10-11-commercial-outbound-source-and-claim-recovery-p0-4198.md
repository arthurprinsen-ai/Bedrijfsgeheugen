# P0 #4198 — Make Brain decisions feed independent commercial channels truthfully

2026-10-11. Original canonical commercial Heartbeat and CRM actions preserved.

## Observed
A live call to the original `powerhouse_materialize_command_center_actions_v1` for Oct11 gave `actions_touched=1`, `research_actions=1`, `email_actions=0`, `linkedin_dm_actions=0`, `linkedin_comments=0`. Of 468 eligible-looking 'linkedin_comment' recommendations from the revenue command center, none contained a verified LinkedIn source URL; 0 approved outbound email actions or DM actions existed. Of 23,295 connecties 605 have a syntactically valid email address, not permission. Existing 5-minute Heartbeat recorded four independent no-action observations, but `evidence` and `context` were JSONB scalars containing serialized JSON text, preventing proper machine readback. The first empty state also prematurely held the hourly idempotency key.

## Fix
- Under the one existing 5-minute Heartbeat, perform a separate **bounded 16s**, advisory-locked, once-per-UTC-hour call to the existing canonical `powerhouse_materialize_command_center_actions_v1` before inspecting outbound lanes. This creates decisions/actions only, never sends provider messages.
- Every lane runs in its own DB transaction, still in parallel, independent from the expensive Brain heartbeat. Per-hour CAS receipt is retained. A `NO_ELIGIBLE_APPROVED_ACTION` observation may atomically advance to `READY` later in the same hour; a `READY` claim cannot be replayed. JSONB output uses `jsonb_build_object` in SQL, avoiding double-quoted event evidence. `queued` is not `delivered`.
- The original Brain command-center materializer now gates LinkedIn comment actions on concrete linkedin.com post URL **and** source `urn:li:share:` or `urn:li:ugcPost:` identifier; otherwise they are research enrichment, not invented comments. LinkedIn DM readiness requires confirmed first-degree connection in contact evidence, not merely a prospect UUID. Existing human approval, source, pressure and identity controls remain.

## Non-goals / truth
No extra scheduler, parallel CRM, nonconsensual bulk e-mail or SalesRobot campaign, forced OAuth, invented likes, or fake delivery counts. Existing SalesRobot `daysOfExecutionRemaining=0` is a provider entitlement boundary; pay/renew legitimately. Connected LinkedIn toolbox exposes list reactions but no authenticated write-like action. Hold like lane until available. Full P0 remains OPEN until provider send/readback for each authorized channel and conversion-to-Brain proofs are real.

## Acceptance
Protected GitHub merge and Supabase migration/deployment; test production `jsonb_typeof(evidence)='object'`, Brain materialization receipt and action candidate split, later-in-hour CAS promotion. Validate external provider readback before saying e-mails, DM, comments, or likes were actually sent.
