# 2026-09-24 — LinkedIn Composio authority v2

- Obligation: `linkedin-composio-authority-v2-20260924`
- Root cause: LinkedIn personal already used Composio, but LinkedIn company still reached the generic Buffer publisher. Buffer 429 handling also contaminated LinkedIn state.
- Change: both LinkedIn personal and company now terminate in explicit Composio publish/readback paths before Buffer fallback. Buffer rate-limit handling no longer writes LinkedIn state.
- Safety: existing publication capability and daily-channel fence remain authoritative. A Composio failure blocks the exact claim and forbids fallback/replacement publishing.
- Verification requirement: only claim published after exact provider URN, author, commentary and PUBLISHED lifecycle readback.
