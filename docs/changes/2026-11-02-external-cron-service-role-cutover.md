# External Cron RPC — proposed least-privilege cutover

**State:** CANDIDATE, not applied. This change must not be merged/applied automatically until the original caller is identified.

## Verified evidence
Supabase advisor continues to report one anon-executable `SECURITY DEFINER` function. Its original body requires a private SHA-256 token; the token is not equivalent to the service-role identity. Its public EXECUTE grant was intentional in a 2026-10-14 migration. Current repository code search returns only the original migration and documentation. Primary Netlify production env names contain no explicitly named external reconcile token, native pg_cron does not call the exposed RPC and pg_stat_statements has no matching invocation. None of these proves an external legacy client does not exist.

## Proposed change
The new guarded migration only changes EXECUTE ACL for the existing function to service_role. It does not alter cron schedules, credential rows, create an alternate scheduler, read secrets or change public customer data. The function's body and private token gate remain intact. It checks exact function identity and current service_role permission and verifies effective privileges after the change.

## Hold before applying
Identify the actual external caller/owner, prove service_role-based invocation or retire it, and record rollback owner, authorization-boundary negative test, normal cron recovery proof and provider advisor readback. If this cannot be proved, maintain the current WARN. Do not claim this candidate is in production or that it fixed Netlify archive visibility.
