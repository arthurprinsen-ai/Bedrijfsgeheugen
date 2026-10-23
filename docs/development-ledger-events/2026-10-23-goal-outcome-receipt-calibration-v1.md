# Development ledger event — 2026-10-23

- **Obligation:** `portal|goal-outcome|verified-receipt-calibration|20261023-v1`
- **Issue:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- **Failure fingerprint:** `portal|goal-learning|status-or-reused-source-trains-calibration|20261023-v1`
- **Base main SHA:** `146f90e33a1c13cae87e6056ab20cd5af44dbe52`
- **Writer:** `fix/portal-goal-outcome-proof-calibration-20261023`; no other candidate may mutate this obligation
- **Source evidence:** existing `goal-outcome-learning.mjs` labels and plain source refs admitted calibration; no receipt dedup; missing measurements converted to zero
- **Safe action:** harden existing learning projector and reuse existing scenario engine
- **Regressions:** `tests/brain-goal-outcome-learning.test.mjs`, `tests/brain-goal-outcome-proof-calibration-v1.test.mjs`, `tests/brain-goal-scenario-engine.test.mjs`
- **State:** CANDIDATE_UNVERIFIED; local pure-logic assertions completed, exact-head Required/CodeQL and production/provider proof unobserved
- **Independent outcome:** null; no causal customer improvement or speedup claimed
- **Resume:** check exact candidate head and provider checks, reconcile any changed main via one-writer CAS/successor; never rewrite terminal candidate, bypass CI or create new scheduler
