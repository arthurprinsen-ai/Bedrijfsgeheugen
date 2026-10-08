# Recover Required's genuine Supabase Preview verification

## Observed failure
On 8 October 2026 PR #4118's Supabase-owned `Supabase Preview` returned `success` at commit `0cc7bef79ad615414fe8187b3786a5922c580f65`. Required's `supabase_preview` job nevertheless failed, because a fresh Actions runner tried to load `tools/ci/supabase-preview-diagnosis.mjs` before checking out the repository. Its exact output was `MODULE_NOT_FOUND`. This is a runner/worktree omission, not a failed Supabase schema replay.

## Single-owner fix
The existing `.github/workflows/required-test.yml` now checks out precisely `needs.preflight.outputs.change_head_sha` with `actions/checkout@v5` before invoking the canonical provider-owned check parser. Persisted checkout credentials are disabled. There is no alternative preview, additional schedule, database mutation, status spoofing or disabled required check.

The existing `tests/brain-supabase-preview-diagnosis-v1.test.mjs` now asserts that the checkout exists, precedes the diagnosis script, and pins the exact preflight HEAD. This prevents the same missing-worktree failure in future changes to Required.

## Verification and release
This is a candidate until Required, CodeQL, protected merge, and source readback complete. Then PR #4118 must be updated against main and pass its own genuine Supabase-owned preview plus Required and CodeQL before protected merge. The Supabase integration already has automatic branching ON, `Supabase changes only` ON, and a limit of three previews. Do not increase capacity without authorizing potential charges outside Spend Cap.
