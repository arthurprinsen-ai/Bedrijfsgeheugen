# 2026-10-20 — SalesRobot provider health at existing hourly assurance
- Parent #4198: provider real account vs Composio connection wrapper.
- Observed existing SQL `powerhouse_dispatch_linkedin_sales_machine_v1` had **no active cron invocation**. Channel capability records expired. Existing scheduled assurance job `powerhouse-autonomous-outreach-assurance-hourly-v1` remains active, existing 3 stages remain unchanged.
- Provider real-time account: DISCONNECTED, cookieExpired=true, TRIAL_EXPIRED, 0 days, campaign PAUSED. 10 suggested DM actions: zero approved and zero SalesRobot prospect-addressable. CRM 23,295 contacts, zero individually approved.
- Fix: add non-sending `mode:provider_preflight` and retain exact provider payment/cookie/health/campaign evidence. Idempotently attach a call to the existing hourly assurance command via `cron.alter_job`, no new scheduler.
- Evidence: tests/brain-salesrobot-linkedin-readiness-v1.test.mjs, canonical brain learning, protected CI/CodeQL/preview, production Edge source readback and DB cron readback. Never mark commercial sent/green without external provider receipts and recipient authority.
