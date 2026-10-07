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
- `netlify-deploy-bridge` version 20 is ACTIVE with bundle SHA-256 `25b3d6be9c40996ca711cd390d390e24b93ba5d74559291a7988b09a669182fc`;
- source and tests are present on PR #4069 under the existing Supabase/backend delivery classification.

No parallel production deployment lane was added.

Post-merge recovery evidence:
- run `37663158817` failed at learning canonicalization because evaluation contained prose instead of canonical Brain test paths;
- run `37663158764` failed at Supabase function-set resolution because `netlify-deploy-bridge` was not declared in `supabase/config.toml`;
- the existing bridge regression also contained a literal `\\n` token and was not syntactically reliable;
- recovery registers the bridge canonically, repairs the regression, adds one canonical Brain test, and narrows config-only Edge attestation to only added/changed function sections while retaining broad fail-closed behavior for shared runtime changes.

Terminal acceptance remains: exact-head Required + CodeQL green, protected merge, Skill Projection green, Supabase Edge Production Authority byte-for-byte provider parity, and no false Netlify production mutation for this Supabase/control-plane-only recovery.
