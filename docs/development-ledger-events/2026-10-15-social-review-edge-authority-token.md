# 2026-10-15 — Social reviewer edge deployment authority

Obligation-ID: powerhouse-social-review-edge-token-20261015
Date: 2026-10-15
Delivery-Lane: automation
State: CODE_CHANGE_ONLY; PRODUCTION_BLOCKED

## Independent provider evidence
- PR #4379 merged at 9f67fa040af399707a227af17426e21e0f4caf14; required test and CodeQL succeeded.
- GitHub Actions "Supabase Edge Production Authority" run 38714468209 failed: each `supabase functions download bg-notion-sync --project-ref adhjwmvyoixzjtmiroln --use-api` reported HTTP 401 `Invalid access token`. It retried 24 times, then emitted `SUPABASE_EDGE_PROVIDER_SOURCE_PARITY_TIMEOUT`.
- Supabase provider check "Supabase Preview" for the same commit failed.
- Independent production readback: `bg-pre-publish-review` v29 (old rule ordering) and `powerhouse-social-publisher` v288 (old retry logic).
- `supabase/config.toml` omitted the already deployed `bg-pre-publish-review` function, preventing its direct provider-source scope and deployment registration.
- Publishing outcomes for 2026-10-15: zero social provider deliveries proven; blog separate Anthropic credit failure.

## Bounded correction
Declare the existing independent reviewer in canonical Supabase config without weakening its deployed JWT mode. Stop the read-only source-parity workflow immediately on authenticated 401 with explicit `SUPABASE_ACCESS_TOKEN_INVALID_REAUTH_REQUIRED`; do not attempt provider deployment, fabricating readback or bypassing protected-main checks. Regression test preserves these contracts.

## Unresolved external authority
Credential owner must rotate the repository's `SUPABASE_ACCESS_TOKEN` in GitHub Actions (environment production if configured), validate Supabase GitHub integration permissions, then perform provider-managed rollout and readback of both production Edge functions. This code cannot repair a rejected secret. Release status remains blocked until provider versions/source parity and post URNs are proved.
