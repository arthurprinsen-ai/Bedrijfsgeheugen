# Netlify production authority JIT source close v1

The production deployment authority is moved from reusable short-lived Netlify MCP proxy storage to just-in-time provider authority.

What changed:
- GitHub OIDC remains the caller identity and is restricted to the Bedrijfsgeheugen repository, `refs/heads/main` and the canonical `production-source-snapshot.yml` workflow.
- The bridge reads the stable `COMPOSIO_API_KEY` from Supabase Vault.
- On every invocation it asks the existing Netlify Composio connected account for a fresh Netlify deployment authority.
- The returned proxy is used only in memory for that invocation and is never written back to Vault, GitHub secrets or repository files.
- Missing Vault authority, failed Composio authority or malformed proxy issuance fails closed with an explicit bridge error.

Observed failure that drove the change:
- Exact-main production run `37659229217` reached the Netlify transport but received three `401 Unauthorized` responses from a stale persisted proxy.
- A subsequent credential-preflight revision correctly surfaced that stale authority earlier as bridge-unavailable instead of passing it deeper into deployment.

Runtime source-close:
- Supabase Edge Function `netlify-deploy-bridge` is ACTIVE on version 20 with the exact protected-main JIT authority implementation (bundle SHA-256 `25b3d6be9c40996ca711cd390d390e24b93ba5d74559291a7988b09a669182fc`).
- `COMPOSIO_API_KEY` is present in Supabase Vault.
- Repository source and contract test now describe the same authority model.

This change does not weaken GitHub OIDC scope and does not introduce a second scheduler, deployment pipeline or secret store.

Post-merge contract closure:
- Powerhouse Skill Projection run `37663158817` correctly rejected prose stored under learning evaluation fields; historical replay, shadow and canary now point to the canonical Brain regression `tests/brain-netlify-production-authority-jit-v1.test.mjs`.
- Supabase Edge Production Authority run `37663158764` correctly rejected the undeclared `netlify-deploy-bridge`; the function is now declared in `supabase/config.toml`.
- The existing bridge regression contained a literal `\\n` token between assertions and is repaired.
- Config-only Edge Function changes no longer expand provider attestation to every declared function. The scope resolver compares the previous/current function sections and selects only added or changed functions; shared-runtime changes remain broad and fail closed.
