# Development ledger — shallow control-plane contract recovery

- Date: 2026-10-06
- Obligation: `ci-control-plane-convergence-20261006-v1`
- Predecessor: #3947
- Failure 1: post-merge Skill Projection run `37477223108` failed because the regression required `fetch-depth: 0`.
- Failure 2: Required run `37477986032` on recovery #3956 failed because Integration Bundle still used `BASE...HEAD` and had no merge base in shallow history.
- Intended invariant: bounded shallow checkout + exact immutable BASE/HEAD identity.
- Recovery: Skill Projection contract requires depth 2; Integration Bundle uses targeted commit fetch + exact two-tree `git diff BASE HEAD`.
- Regression: `tests/brain-learning-canonicalization-gate-v1.test.mjs` and `tests/brain-integration-bundle-compiler-v1.test.mjs`.
