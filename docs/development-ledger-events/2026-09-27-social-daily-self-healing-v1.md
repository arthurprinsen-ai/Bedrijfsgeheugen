# Development ledger event — social-daily-self-healing-v1

- Date: 2026-09-27
- Obligation: daily-social-delivery
- Failure class: DAILY_SOCIAL_DELIVERY_GAP
- Channels: LinkedIn personal, LinkedIn company, Instagram company
- Scheduler owner: existing `powerhouse-content-closed-loop-v1` every 5 minutes
- LinkedIn recovery: probe all active Composio connections; select canonical member identity; ignore revoked siblings
- Personal source recovery: least-recently-used verified non-sensitive source, new-angle-only, no verbatim reuse
- Buffer fallback: forbidden
- Skill projections: `linkedin-composio-publisher`, `personal-linkedin-life-only`
- Regression: `tests/social-daily-self-healing-v1.test.mjs`
