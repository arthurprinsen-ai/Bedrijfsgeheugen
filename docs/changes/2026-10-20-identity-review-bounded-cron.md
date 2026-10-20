# Production recovery — bounded canonical identity/authority cron
Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Date: 20 October 2026

## Observed causal chain
PostgreSQL logs showed repeated statement / lock / cron job-startup timeouts coinciding with commercial heartbeats, contact authority, DM, comment, like and email dispatch. Existing job 138 ran on four quarter-hour slots and attempted up to 3,000 contact operations per run. Even basic SQL repeatedly timed out. This is operational degradation, not proof that any recipient or media could be reached.

## Canonical-only action
Bound the existing identity graph job to one contact pulse of 200 plus one contact authority review of 200 per slot, six different non-52 minute slots each hour. Leave its original graph refresh on minute 32, permissions, approvals, CRM, scheduler owner, other cron jobs, provider routes and consent guards intact. The update is safe to rerun against either the original or previously amended command; fail closed if owner or command diverged.

## Production verification
Direct production readback before durable migration confirmed job 138 ACTIVE, one pulse(200), one authority-loop iteration, original identity graph, six runs per hour; a manual contact review returned BUSY because the advisory lock was held and MUST NOT be counted as an actual review. New desired schedule moves the slot 52 to 47 to avoid colliding with job 129 hourly assurance. All connections reviewed is a separate metric requiring actual run counts, not theoretical schedule throughput.

## Acceptance and remaining boundaries
Protected CI/CodeQL and Supabase Preview; apply migration only once, independently inspect cron settings and run outcomes; monitor statement/cron timeouts, existing 23,295 daily connection reviews, email recipient approvals, user-authorized outreach and actual LinkedIn/Instagram provider receipts. No synthetic 100% / LIVE_PROVEN status.
