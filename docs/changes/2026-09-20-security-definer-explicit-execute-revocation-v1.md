# Explicit SECURITY DEFINER execute revocation

Fingerprint: `security-definer-explicit-execute-revocation-v1`.

The Composio Vault writer is server-only. The security gate requires the machine-verifiable form:

`REVOKE EXECUTE ON FUNCTION ... FROM public, anon, authenticated;`

This replaces the broader `REVOKE ALL` spelling. The effective permission model stays service-role-only, but the contract is now explicit and fail-closed.
