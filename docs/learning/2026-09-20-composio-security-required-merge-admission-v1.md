# Composio security and exact-head merge admission recovery

PR #2475 exposed two coupled control-plane defects.

First, the new internal SECURITY DEFINER Vault writer revoked `ALL`, while the canonical machine security contract requires explicit `REVOKE EXECUTE ON FUNCTION ... FROM public, anon, authenticated`. Production ACL was already service-role-only, but the repository contract was not machine-recognizable.

Second, #2475 merged while canonical Required was still running and the Supabase Security Contract plus Supabase PR Preview were red. A generic protected status context named `test` cannot be treated as proof that the canonical Required workflow for the current head succeeded.

Recovery:
- use explicit execute revocation;
- align the regression with the security contract;
- require executing agents/writers to read exact-head Required/BRAIN/CodeQL and relevant domain gates immediately before merge;
- never infer merge authority from mergeable=true or a generic status name.
