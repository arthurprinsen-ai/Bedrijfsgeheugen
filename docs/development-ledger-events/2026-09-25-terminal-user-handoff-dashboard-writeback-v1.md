# 2026-09-25 — terminal user handoff + dashboard writeback

- Fingerprint: `delivery|terminal-user-handoff|dashboard-writeback|v1`
- User-visible incident: recovery status was surfaced with implied follow-up instead of being carried autonomously to terminal proof.
- Root cause: dashboard/current-state registration and the standard user-facing terminal response were not explicit machine-level terminal gates.
- Fix: continuity policy + AGENTS + continuity skill + regression + learning/docs now require terminal closure and existing Powerhouse dashboard/current-state/activity writeback.
- Notion readback: the rule is present in Dashboard Hub `3e4da36a-ac8a-81fb-b340-daccce80dec8` and Canonical System Map `3dcda36a-ac8a-8152-be3d-edbb32b06239`.
- Supabase recovery: `composio_content_fallback_governance_v1` is applied in production and ledger identity is `20260925074007`; repository migration identity is reconciled to match.
- Terminal state: pending protected GitHub delivery and exact-main/terminal closure readback for this governance change.
