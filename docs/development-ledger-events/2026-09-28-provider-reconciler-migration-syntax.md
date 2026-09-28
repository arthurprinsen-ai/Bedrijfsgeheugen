# 2026-09-28 — Provider reconciler migration syntax closure

- **Fingerprint:** `provider-reconciler-migration-syntax-closure-v1`
- **Class:** delivery artifact / clean-replay syntax.
- **Observed:** clean execution failed at the first REVOKE because the preceding dollar-quoted function definition lacked its terminating semicolon.
- **Root cause:** live function text was copied into a repository migration without restoring the SQL statement terminator.
- **Fix:** terminate the function with `$function$;` and retain fail-closed EXECUTE revocations plus service-role grant.
- **Prevention:** migration replay is mandatory evidence even when runtime state is already healthy.
- **Production action:** corrected migration reapplied; content-loop and social-publisher redeployed from canonical code.
- **Related behavior:** `provider-write-terminal-all-social-v1` remains authoritative for no-duplicate provider-side-effect handling.
