# 2026-09-25 — terminal migration identity reconciliation

- Obligation: terminal-delivery-dashboard-migration-reconcile-v1
- Fingerprint: `supabase|migration-readback|unique-name-reconcile|v2`
- Production observation: expected Git migration `20260925073300_composio_content_fallback_governance_v1`; applied Supabase migration `20260925074007_composio_content_fallback_governance_v1`.
- Root cause: exact timestamp identity was stricter than provider-controlled migration application semantics.
- Fix: exact identity preferred; unique-name reconciliation allowed only when unambiguous; ambiguous duplicates remain fail-closed.
- Regression: `tests/brain-powerhouse-supabase-migration-readback-name-reconcile-v2.test.mjs`.
- Powerhouse terminal handoff/dashboard rule already canonical on main in policy v1.6 and `.agents/skills/powerhouse-continuity/SKILL.md`; no duplicate authority introduced.
