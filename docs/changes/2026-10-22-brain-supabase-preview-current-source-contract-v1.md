# BRAIN Supabase Preview retired-workflow source-contract recovery — 22 Oct 2026

Parent #3742; related #4215; blocked Portal #4573. Candidate obligation `ci-brain-supabase-preview-retired-workflow-test-sourcing-20261022`.

## Evidence
Exact [Unified BRAIN backend run](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39671036043/job/119469063095) failed 321/3511 cases. Seven separate inherited test failures were caused by opening deleted `.github/workflows/supabase-preview-applicability.yml`: six in `tests/brain-supabase-preview-applicability-v1.test.mjs`, one in `tests/brain-supabase-migration-history-parity-v1.test.mjs`.

Current source authority instead has: `.github/workflows/required-test.yml` (`supabase_source_contract`, `supabase_preview`), reusable `.github/workflows/supabase-pr-preview.yml`, `tools/ci/supabase-preview-diagnosis.mjs` provider check classification, and `scripts/brain/check_powerhouse_supabase_security.py` immutable historical-mirror blob validation.

## Repair
- Replace six obsolete filename/inline-workflow tests with real source + behavior tests: PR-to-main trigger, scope applicability, provider-owned exact head, spoof rejection, missing/skipped/neutral/failure cannot pass and stable success requires repeated provider observation.
- Replace only the obsolete workflow-dependent migration mirror test with real security gate's immutable historical Git blob/hash contract. Leave all other migration/ledger assertions untouched.
- Do not recreate retired workflow, skip a test, restore already-applied executable SQL, loosen RLS, forge provider evidence or alter production.

## Acceptance
Test both complete updated files; then full exact-head BRAIN backend, Required and CodeQL success, protected merge and provider readback; leave unrelated migration parity and authenticated tenant A/B acceptance separately open as required. Current candidate is **not** a claim of seven green tests, full BRAIN green, migration parity or production success.
