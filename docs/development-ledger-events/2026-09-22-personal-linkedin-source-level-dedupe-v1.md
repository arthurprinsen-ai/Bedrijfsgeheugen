# Development ledger — personal LinkedIn source dedupe

- Date: 2026-09-22
- Fingerprint: `personal-linkedin-source-level-dedupe-v1`
- Incident: the printer story was selected again as the daily personal fallback.
- Root cause: dedupe operated too late; source identity was not excluded.
- Production hotfix: applied in Supabase and verified by function readback.
- Current-day duplicate recommendation was marked `skipped` with duplicate-source evidence.
