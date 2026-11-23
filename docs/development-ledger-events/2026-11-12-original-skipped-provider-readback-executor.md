# 2026-11-12 — historical provider-readback consumer original publisher

- Incident #4198; source 16 historical SKIPPED/external references → original #171 BRAIN 16 OVERDUE_PROVIDER_READBACK OPEN → original powerhouse-social-publisher `run`/`audit_only`.
- Root cause: exact provider reconciliation selected only the current runDate; historical ack had no active consumer despite written original owner.
- Fix: existing original publisher reads eligible historical fenced IDs, bounded 3 per run with 24h cooldown; exact-source CAS claims and stores provider GET result; only existing Composio Instagram/LinkedIn GET endpoints; original source status and all provider create channels unchanged.
- Fail closed: 400/403 is access uncertainty, internal 24-hex != provider ID; exact ID, owner and publication day needed; no proven independent next action/outcome yet.
- Regressions: `tests/brain-original-skipped-provider-readback-executor-20261112.test.mjs`. Source: `supabase/functions/_shared/original-skipped-provider-readback-selection.mjs`, `supabase/functions/powerhouse-social-publisher/index.ts`. Original skill updated.
- Terminal gates: original protected Required/CodeQL/BRAIN; native Supabase Edge live bundle; normal authenticated audit provider probes and original source consumer readback; do not mark as LIVE merely on merge.
