# Third-party GitHub Actions pinned to a commit

**Date:** 29 October 2026. **Status:** candidate, not production-proven until the protected merge and one green run of each touched workflow.

Four steps ran third-party actions by moving tag (`openai/codex-action@v1` in blog-bijwerken and weekblog, `supabase/setup-cli@v1` in supabase-edge-production-authority and supabase-supported-migration-repair-3742) with secrets in scope.

## Bounded implementation
- Pinned to the commits those tags pointed to on 29 October: codex-action `bdf19a4a` (v1.13), setup-cli `1dedf2c6` (v1.7.3). Same code, now immutable. The version stays in a comment so Dependabot (github-actions, weekly) proposes updates.
- `tests/brain-third-party-actions-sha-pin-v1.test.mjs` fails any third-party action that is not pinned to a 40-character commit. First-party `actions/*` and `github/*` keep tags.
- `tests/brain-native-openai-blog-provider-20261019.test.mjs` asserted the literal `@v1`; it now asserts a pinned commit.
- Repository settings changed outside Git on 29 October: default workflow permissions `read`, workflows cannot approve pull requests, Dependabot security updates on. All 123 workflows already declare their own permissions (#5066), so none depend on the old default. Rollback: Settings, Actions, General, Workflow permissions.

## Correction
The 28 October note on the blog brief guard says the blog of 25 October is live with internal wording. Re-checked on 29 October: the live page has none of the internal terms. Only its URL slug is meta. Left as is on purpose (3 days old, live proof and sitemap contract depend on the URL).
