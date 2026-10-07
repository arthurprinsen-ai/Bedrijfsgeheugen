# 2026-10-07 — Netlify JIT deploy authority source close

The production delivery failure was isolated to the Netlify provider-auth transport layer.

GitHub OIDC authentication to the existing Supabase deploy bridge was healthy. The downstream Netlify MCP proxy had been persisted and reused even though provider issuance is short-lived. Reuse produced bounded 401 Unauthorized failures before any new production release could be proven.

The bridge is now source-controlled and changed to acquire a fresh Netlify deployment authority just in time through the existing Composio Netlify connection. Repository, ref and workflow OIDC scoping remains fail closed. Issued proxy URLs are not persisted.

Terminal evidence still requires exact-main Netlify production identity plus live Security Trust Center readback.