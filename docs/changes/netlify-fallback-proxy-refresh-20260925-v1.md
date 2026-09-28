# Netlify fallback proxy refresh

The exact-source production fallback can fail with `401 Unauthorized` even though the GitHub OIDC bridge returned a Netlify proxy earlier in the same job. This recurred on 28 September 2026 in Production Source Snapshot run `36476034816`.

The failure is transport credential lifetime, not a site build defect. The production snapshot now performs a fresh GitHub OIDC exchange and obtains a new Netlify MCP proxy immediately before the fallback `npx @netlify/mcp` upload. The refreshed proxy is then used for the provider-side deployment/readback.

The terminal contract is unchanged: protected main must reach Netlify production and provider/browser readback must prove the accepted production identity. Persistent authentication failure remains fail-closed.
