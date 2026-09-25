# Netlify fallback proxy refresh — 25 September 2026

The exact-source production fallback could fail with `401 Unauthorized` even though the OIDC bridge had returned a proxy earlier in the same job. The credential was acquired before the linked-build attempt and then reused after provider polling and fallback preparation.

The production snapshot now performs a fresh GitHub OIDC exchange and obtains a new Netlify MCP proxy immediately before the fallback `npx @netlify/mcp` upload. This keeps the short-lived transport credential aligned with the moment it is actually used.

The deployment contract remains unchanged: protected `main` must equal Netlify `commit_ref`, followed by live NL/EN browser readback before `LIVE_BEWEZEN`.
