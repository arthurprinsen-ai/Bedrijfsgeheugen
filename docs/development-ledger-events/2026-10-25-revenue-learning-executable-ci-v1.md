# Revenue-learning test execution repair — 2026-10-25

- P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Source: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4851
- Fingerprint: ci|revenue-learning|new-evidence-regression-unwired|20261025-v1
- First focused CI: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40175013091 (legacy fixtures and migration parity failed)
- First Required: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40175013135 (direct PR trigger count 8 > budget 7)
- Correct owner: existing Required CI preflight and legacy revenue evaluator test fixture
- Positive: explicit observed/referenced paid evidence and controlled cohort, exact running learning test
- Negative: inferred/unknown/missing-source rows cannot yield PROVEN
- No additional workflow trigger or scheduled runtime; original Revenue Learning workflow restored
- Known distinct remaining issue: local-vs-baseline Supabase migration-history parity. Do not bypass.
- Status: CANDIDATE_PENDING_EXACT_HEAD_CI, no simulated success.
