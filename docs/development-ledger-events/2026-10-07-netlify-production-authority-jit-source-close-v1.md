# 2026-10-07 — Netlify production authority JIT source close

The recurring Netlify production 401/503 transport failure is closed at its actual authority boundary.

Root cause: the canonical GitHub OIDC bridge was healthy, but it reused a short-lived Netlify MCP proxy persisted outside the provider session that created it.

Structural correction:
- retain GitHub OIDC as canonical caller authentication;
- retain Supabase Edge Function as the existing bridge;
- use the stable Vault-held Composio project key only to request fresh Netlify provider authority at invocation time;
- never persist issued Netlify proxy authority;
- fail closed before deployment when fresh provider authority cannot be proven.

Runtime readback:
- `COMPOSIO_API_KEY` exists in Supabase Vault;
- `netlify-deploy-bridge` version 15 is ACTIVE;
- source and tests are present on PR #4069 under the existing Supabase/backend delivery classification.

No parallel production deployment lane was added.
