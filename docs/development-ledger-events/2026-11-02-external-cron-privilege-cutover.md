# Original ONE BRAIN development activity — external cron RPC least-privilege candidate

- Date: 2026-11-02
- Obligation: `powerhouse-security-external-cron-least-privilege-cutover-20261102-v1`
- Original incident: `supabase-security|external-cron-reconcile|anon-definer-rpc-advisor-warn|v1`
- Scope: one guarded immutable ACL migration source, machine learning, single regression, Security Agent skill, human explanation and this activity ledger.
- Provider evidence: native Supabase advisor WARN and pg_proc anon EXECUTE, no referenced repository client, native pg_cron no invocation, no explicitly named primary Netlify environment key, and zero matching pg_stat_statements rows. Unknown third-party external clients are not excluded.
- Authorization: **DRAFT HOLD** until original caller/credential identity and rollback owner have been independently verified. Do not disable a daily executor to clear an advisor.
- Proposed fix: `anon` and `authenticated` EXECUTE denied; `service_role` remains authorized. The token validation and cron schedules are untouched.
- Prevention: every privileged browser-callable definer must be least-privilege reviewed with consumer ownership, source-controlled protected migration, negative/positive auth proof and independent provider advisor readback.
- Test: `tests/brain-security-external-cron-service-role-20261102.test.mjs`, evaluation historical/shadow/canary all required.
- Evidence states: source candidate != applied migration != green provider status; prevent false green in the existing Security Trust Center.
- CI incident: first #5319 hygiene failure `PR_MACHINE_METADATA_INVALID:CANDIDATE_TYPE_INVALID` was corrected in PR metadata without changing security controls. Rerun exposed `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger`, resolved with this original activity ledger, not by bypassing the closure gate.
