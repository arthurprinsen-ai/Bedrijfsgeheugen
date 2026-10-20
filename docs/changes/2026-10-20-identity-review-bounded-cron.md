# Production recovery — bounded canonical identity/authority cron
Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Date: 20 October 2026

## Observed causal chain
PostgreSQL logs showed repeated statement / lock / cron job-startup timeouts coinciding with commercial heartbeats, contact authority, DM, comment, like and email dispatch. Existing job 138 ran on four quarter-hour slots and attempted up to 3,000 contact operations per run. Even basic SQL repeatedly timed out. This is operational degradation, not proof that any recipient or media could be reached.

## Canonical-only action
Bound the existing identity graph job to one contact pulse of 200 plus one contact authority review of 200 per slot (both argument values enforced; prior live patch still called contact authority with 500), six different non-52 minute slots each hour. Leave its original graph refresh on minute 32, permissions, approvals, CRM, scheduler owner, other cron jobs, provider routes and consent guards intact. The update is safe to rerun against either the original or previously amended command; fail closed if owner or command diverged.

## Production verification
Direct production readback before durable migration confirmed job 138 ACTIVE, one pulse(200), one authority-loop iteration, original identity graph, six runs per hour; a manual contact review returned BUSY because the advisory lock was held and MUST NOT be counted as an actual review. New desired schedule moves the slot 52 to 47 to avoid colliding with job 129 hourly assurance. All connections reviewed is a separate metric requiring actual run counts, not theoretical schedule throughput.

## Acceptance and remaining boundaries
Protected CI/CodeQL and Supabase Preview; apply migration only once, independently inspect cron settings and run outcomes; monitor statement/cron timeouts, existing 23,295 daily connection reviews, email recipient approvals, user-authorized outreach and actual LinkedIn/Instagram provider receipts. No synthetic 100% / LIVE_PROVEN status.

## Follow-up direct production observation
The initial live hotfix decreased the connection-pulse argument to 200 and authority loops to one, **but did not decrease the actual authority function argument**: the live command still contained `::date,500);`. A fresh targeted SQL readback proved this. Before this migration, the actual maximum was therefore 200+500=700 operations per run, not the previously stated 400. The final migration explicitly rewrites and asserts `::date,200);` and `v_date,200);` independently. Never claim that the bound is live until those two separate production readbacks pass.

## Native Supabase Preview absent runtime job
The first preview failed with `CANONICAL_IDENTITY_GRAPH_JOB_MISSING` because the ephemeral preview has migrations but **does not provision production-only cron job 138**. The migration intentionally no-ops if no owner exists, instead of creating a duplicate scheduler. On production, the owner exists and its exact command/schedule must be independently verified; drift on an existing owner still raises and aborts. This is not a waived production test.
