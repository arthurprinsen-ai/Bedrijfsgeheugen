# Development ledger — 2026-10-29 Brain observation guard preview idempotence

Cause: provider preview runs historical semantic guard against already-canonical `brain_observe_failure`; old guard recognizes only pre-repair SQL, fails with BRAIN_FAILURE_OBSERVE_SOURCE_DRIFT.
Evidence: real Supabase production function source/EXECUTE readback; full GitHub Preview failure snippet from PR #5106.
Repair: preserve old identity check, accept current only with all evidence-preservation, conflict, advisory-lock, SECURITY DEFINER, search-path, service-role ACL constraints; unchanged subsequent function code.
Proof required: new negative regressions, old semantic recovery suite, full learning modes, Required/CodeQL and provider preview after protected merge. No direct database writes or fake green.
