# Development ledger — SalesRobot LinkedIn provider readiness

- Date: 2026-10-08 (Europe/Amsterdam).
- Canonical obligation: commercial-linkedin-salesrobot-readiness-20261008-v1; commercial P0 #4198.
- Existing source: `supabase/functions/powerhouse-linkedin-sales-machine/index.ts`; existing POWERHOUSE commercial heartbeat and provider routing retained.
- Provider evidence: connected LinkedIn account HEALTHY; SalesRobot latest registered campaign `Bedrijfsgeheugen` UUID `ae2812ad-c3eb-4c90-a0d4-6d4e5a94b93e`; state CREATED, zero prospects, not startable.
- Subscription discrepancy: web UI indicates 6 trial days left, API execution days 0. Preserve both observations; fail closed on provider execution.
- Database capability `salesrobot.campaign_outreach` updated to CONFIG_REQUIRED with exact campaign identity and evidence.
- Code: fail-closed readiness guard for billing, executable days, campaign existence and active status. Existing human message quality and approval checks unchanged.
- Regression: `tests/brain-salesrobot-linkedin-readiness-v1.test.mjs`.
- PR #4206 first admission failed because machine metadata was missing; repaired metadata then admission required brain learning, activity ledger, and human documentation. All required artifact types are now authored.
- External sends: NONE authorized by this change. Protected test, merge and production Edge readback not yet proven at this writing. Cannot claim the autonomous commercial loop or €1m revenue.
