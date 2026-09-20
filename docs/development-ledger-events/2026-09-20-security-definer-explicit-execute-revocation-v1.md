# Development ledger — security-definer-explicit-execute-revocation-v1

- Date: 2026-09-20
- Incident: PR #2475 merged while Supabase security/preview sibling checks were red.
- Root cause: SECURITY DEFINER migration used REVOKE ALL rather than the explicit REVOKE EXECUTE form required by the security contract.
- Fix: explicit browser-role EXECUTE revocation + regression.
- Promotion rule: migration must not be applied to production until the recovery PR gates are green.
