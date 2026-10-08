# 2026-10-08 — Required Supabase exact-head checkout recovery

- **Obligation ID:** `supabase-preview-missing-checkout-20261008-v1`
- **Canonical owner:** `.github/workflows/required-test.yml` `supabase_preview` job and `tools/ci/supabase-preview-diagnosis.mjs`.
- **Observed evidence:** Native Supabase preview green for PR #4118 SHA `0cc7bef79ad615414fe8187b3786a5922c580f65`; Required run `37751320123`, job `113225405716` failed `MODULE_NOT_FOUND` because there was no checkout of the repository.
- **Mutation:** Add exact-head `actions/checkout@v5` with `persist-credentials: false` before local diagnosis script; add dedicated regression assertions into `tests/brain-supabase-preview-diagnosis-v1.test.mjs`.
- **Invariant:** Genuine Supabase-owned provider status, exact-head identity, Required, CodeQL and protected merge remain mandatory; this job must not bypass them.
- **Unchanged:** Supabase quota (3), organization spend cap, production schema, provider settings and all other workflows.
- **Terminal readback:** Protect-merge current PR after all required checks; inspect main source and verify PR #4118 passes fresh provider replay and merge. Do not mark `LIVE_PROVEN` before this evidence.
