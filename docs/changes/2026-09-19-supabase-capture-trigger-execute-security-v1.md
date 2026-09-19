# Supabase capture-trigger least-privilege hardening

- Obligation-ID: supabase-capture-trigger-execute-security-v1
- Source program: #1863 security/data-governance stream.
- Supabase security advisor found seven trigger-only `SECURITY DEFINER` functions directly executable by both `anon` and `authenticated`.
- Provider migration `restrict_capture_trigger_execute_v1` revoked PUBLIC/anon/authenticated EXECUTE and retained service-role execution.
- Provider readback after migration: zero WARN security advisor findings; only `rls_enabled_no_policy` INFO remains for deny-all client tables.
- Repository migration and regression test preserve the provider state in source control.
- Status: RECOVERABLE_INCOMPLETE until this exact source candidate is merged and migration readback is represented on current main.
