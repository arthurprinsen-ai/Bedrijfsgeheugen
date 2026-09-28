# Development ledger event — powerhouse-linkedin-sales-machine-v1

- Date: 2026-09-28
- Obligation: powerhouse-linkedin-sales-machine-v1
- Lane: backend / revenue-growth / social
- Candidate: implementation
- Planner: public.powerhouse_prepare_linkedin_sales_machine_v1(date)
- Dispatcher: public.powerhouse_dispatch_linkedin_sales_machine_v1(date)
- Worker: powerhouse-linkedin-sales-machine
- Comment executor: powerhouse-social-publisher cockpit autopilot
- Company content executor: powerhouse-content-orchestrator
- Private fallback: autonomous email
- Max comments/day: 3
- Comment cooldown/person: 14 days
- Email delay after LinkedIn comment: 24 hours
- LinkedIn create-post capability: true
- LinkedIn create-comment capability: true
- LinkedIn create-reaction capability: false
- LinkedIn send-DM capability: false
- DM fallback: email
- Sales-air-cover identity: linkedin_company
- Personal post identity policy unchanged: personal-life-only
- Scheduler owner: powerhouse-commercial-learning-v1

- Revenue-first execution policy: autonomous
- Per-action human approval: not required when all canonical gates pass
- Autonomous choices: LinkedIn context comment / LinkedIn company air cover / private email / nurture-wait
- Optimization target: reply -> meeting -> scan -> order -> realized revenue
- Hard gates: identity / evidence / dedupe / fatigue / suppression / provider capability / provider acknowledgement
- Future LinkedIn DM/reaction writes: disabled until capability probe + provider-ack regression evidence exists

- Terminal status: LIVE_PROVEN
- Protected main merge: 73e954d9e62af66cf6f47ff63df9041a98a2d519 via PR #3167
- Edge readback: powerhouse-linkedin-sales-machine ACTIVE v2; powerhouse-autonomous-outreach ACTIVE v2; powerhouse-social-publisher ACTIVE v74
- Runtime readback: planner/dispatcher RPCs present; canonical commercial scheduler active; sales-air-cover current; LinkedIn comment queue live
- Dedicated LinkedIn Sales Machine cron: 0
