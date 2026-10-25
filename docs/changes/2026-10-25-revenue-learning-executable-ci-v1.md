# 2026-10-25 — Source-backed revenue regressions in canonical Required CI

Problem: PR #4851 passed generic Required/CodeQL, but the new exact regression file was not included in the selected test suite. When explicitly exercised, the legacy evaluator fixtures lacked required source provenance. The attempt to add a direct PR trigger to the existing focused Revenue Learning workflow caused the CI ratchet (max seven direct PR workflows) to correctly block #4853.

Smallest safe correction: restore the focused Revenue Learning workflow exactly as it was; use the existing **Required test** preflight (already run for every PR) to execute both `tests/revenue-learning-evaluate.test.mjs` and `tests/brain-revenue-learning-fair-verified-20261025.test.mjs`. Update the old positive fixtures to explicitly include `OBSERVED` source receipts and preserve the negative missing-evidence verdict. Do not relax live source verification.

The focused push-main Revenue Learning suite also reports an unrelated migration-history parity failure. Keep that discrepancy open for its existing migration owner; do not skip, suppress or represent that suite as green.

Acceptance: exact-head Required including both tests, CodeQL and protected merge, then exact Netlify production and real hourly run readback; no new scheduler, PR admission workflow, customer data or sending.
