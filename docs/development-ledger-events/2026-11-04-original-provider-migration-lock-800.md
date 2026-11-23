# Source ledger — independent Supabase 800 version readback

- Original owner: `original Supabase Git main migration-history authority / ONE BRAIN delivery`; canonical incident #4198.
- Trigger: PR #5389 protected merged and original production migration `20261104074100` independently applied; full BRAIN run `41792546872` failed and downstream `close-obligation` check job `126448816641` blocked with `TERMINAL_CRITICAL_GATE_FAILED:BRAIN`.
- Direct production `Supabase.list_migrations`: 800 applied identities. Native GitHub main tree: 800 executable source SQL files. Independent comparison: 0 mismatched version/name pairs. Historical lock contained only 791 (captured 2026-11-02T14:22:29.459Z).
- Exact missing provider-backed identity set: 20261103124000; 20261103141902; 20261103142201; 20261103143000; 20261103223001; 20261104051200; 20261104052001; 20261104065001; 20261104074100.
- Source change: append exactly these already-applied records and update observed provider timestamp `2026-11-04T07:43:05.326605Z`. No SQL changed, no migration version invented, no new schedule, no provider action, no unknown side-effect replay.
- Regression: `tests/brain-original-supabase-800-provider-migration-lock-20261104.test.mjs`; original existing lock source tests remain. Structured learning and original skill updated to prevent stale post-merge BRAIN lock.
- **Unfinished:** no claim full BRAIN green, terminal post-merge workflow closed, independent external provider action or all recovery incidents resolved. Additional unrelated full-suite BRAIN failures require own source owner.
