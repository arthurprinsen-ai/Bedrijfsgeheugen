# 2026-09-24 — Netlify GitHub OIDC deploy bridge v1

Observed:
- current main was not receiving a Netlify production deploy;
- Netlify deploy previews still proved the GitHub App integration was alive;
- previous GitHub Actions Netlify proxy secret had expired;
- no safe repository-secret write interface was available to the agent.

Implemented:
- encrypted fresh deploy transport in Supabase Vault;
- service-role-only RPC for the vault value;
- Edge Function `netlify-deploy-bridge` with GitHub OIDC signature/claim validation;
- `id-token: write` permission on Production Source Snapshot;
- runtime acquisition + masking of the deploy proxy;
- removal of active dependency on `secrets.NETLIFY_MCP_PROXY_PATH_TEMP`.

Terminal proof remains:
exact production SHA → pricing content → pricing interactions → NL→EN `/en/prijzen`.
