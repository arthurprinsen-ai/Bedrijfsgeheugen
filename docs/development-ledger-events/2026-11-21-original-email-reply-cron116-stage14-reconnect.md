# Development ledger — canonical commercial cron116 reply-loop reconnect

Date: 2026-11-21

Original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/6098

Obligation-ID: powerhouse|email|original-116-reply-live-readback|20261121-v1

Source lineage: current protected main revision 0c47417fd05445a860939197b81b8611627b5f75; existing cron.job #116; existing stage14 `powerhouse_commercial_learning_cycle_v1` -> original, deployed `powerhouse-email-reply-loop` v1216 -> Composio Gmail -> original `powerhouse_email_reply_events`, `powerhouse_sales_outcomes`, `bg_gezondheid` -> ONE BRAIN / Heartbeat.

Live source observation: 336/336 recent healthy 116 runs with zero reply-loop dispatch in public pg_proc, 9 historical health records last Oct20, 4 historical reply events last Oct11; 0 post-deployment reply events. An active deployed function was orphaned from its original single scheduler.

Intervention: new SQL migration upgrades only cron.job #116 command with stage14 conditional, invoking original `bg_roep_functie` and recording original pg_net provider request ID without new cron or Gmail provider. Fail-closed on changed scheduler contract, missing JWT scheduler token or second active reply cron; original issue queue on per-stage error. Privacy/consent unchanged.

Tests: tests/brain-original-email-reply-116-reconnect-20261121.test.mjs.
Learning: brain/learning/2026-11-21-original-commercial-email-reply-scheduler-disconnected.json.
Agents: .agents/skills/powerhouse-relationship-revenue/SKILL.md.

Truth boundary: CODE_CANDIDATE until Required/CodeQL/SQL migration applied, exact original cron.job source readback, natural reply invocation provider response plus bg_gezondheid. Commercial reply and revenue require actual independent Gmail and payment receipts. Never re-send older completed actions.
