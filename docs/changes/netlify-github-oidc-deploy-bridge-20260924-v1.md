# GitHub OIDC → Netlify deploy bridge — 24 September 2026

Production delivery had two independent failures:
1. Git-linked Netlify production stopped advancing to current `main`;
2. the GitHub Actions fallback secret `NETLIFY_MCP_PROXY_PATH_TEMP` had previously expired.

The repair removes the long-lived GitHub secret from the active delivery path.

## New flow

1. `Production Source Snapshot` requests a short-lived GitHub Actions OIDC token.
2. The token audience is fixed to `bedrijfsgeheugen-netlify-deploy-bridge`.
3. Supabase Edge Function `netlify-deploy-bridge` verifies:
   - GitHub OIDC issuer;
   - exact audience;
   - repository `arthurprinsen-ai/Bedrijfsgeheugen`;
   - ref `refs/heads/main`;
   - exact workflow ref for `production-source-snapshot.yml`.
4. Only after those checks does the function read the deploy transport from Supabase Vault using service-role authority.
5. GitHub masks the returned proxy before exporting it into the job environment.
6. The existing Netlify MCP deploy and exact production/browser proof remain unchanged.

The credential is never written to repository content, PR text, artifacts, or user-visible output.
