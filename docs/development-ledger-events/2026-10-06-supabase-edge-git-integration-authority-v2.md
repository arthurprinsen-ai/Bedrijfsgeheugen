# 2026-10-06 — Supabase Edge Git integration production authority v2

Obligation: `supabase-edge-provider-attestation-authority-20261006-v1`

Observed:
- #3898 protected-merged the protected-main authority policy;
- its first `Supabase Edge Production Authority` run `37461804855` failed in `Prove trusted current-main authority`;
- failure was `SUPABASE_ACCESS_TOKEN_REQUIRED_FOR_PROTECTED_MAIN_PROMOTION`;
- the canonical Supabase secret store contains no Supabase access token under the checked management-token names;
- the Supabase GitHub Integration is already connected and emits commit-bound provider checks;
- Supabase documentation defines `Deploy to production` as the provider-native path for production-branch migrations and changed Edge Functions.

Repair:
- remove the static-PAT/CLI production writer from GitHub Actions;
- leave one provider writer: Supabase GitHub Integration from protected `main`;
- make GitHub Actions an exact-SHA, stable-success provider attestor;
- retain source-tree hashes, single-flight execution and fail-closed runtime-drift checks.

Terminal criteria:
exact-HEAD gates green → protected merge → a later Supabase Edge source change on protected main produces a successful exact-SHA production Supabase App check → attestation artifact records stable provider proof without a static PAT or parallel CLI writer.
