# 2026-10-20 — SalesRobot Composio v3.1 identity binding fix
- Parent https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Existing API V3.1 execute path omitted `user_id`, causing provider probe HTTP 400 despite active Composio connection.
- Observed canary v22: HTTP 200 overall / dm CONFIG_REQUIRED / provider error 400 / canonical_mutations=false.
- Two independent read-only provider probes with exact connected-account `user_id`: HTTP 200, one disconnected TRIAL_EXPIRED LinkedIn account each.
- Corrective source: bind account `user_id` in both tool executions, fail closed on missing identity and timeout after 18 seconds; retain approved recipient & quality/readback controls.
- Regression: `tests/brain-salesrobot-linkedin-readiness-v1.test.mjs`.
- Zero external sends. CI/Preview/protected merge/prod canary required; licencing/reconnection remains external hard boundary.

