# Development ledger — Supabase capture trigger privileges

- Date: 2026-09-19
- Obligation-ID: supabase-capture-trigger-execute-security-v1
- Source program: #1863
- Provider preflight: 14 WARN findings across 7 trigger-only SECURITY DEFINER functions (anon + authenticated).
- Action: applied migration `restrict_capture_trigger_execute_v1`.
- Provider readback: WARN count = 0.
- Source migration: `supabase/migrations/20260919123730_restrict_capture_trigger_execute_v1.sql`.
- Regression: `tests/brain-supabase-capture-trigger-execute-security-v1.test.mjs`.
- Status: RECOVERABLE_INCOMPLETE until protected merge/current-main readback.