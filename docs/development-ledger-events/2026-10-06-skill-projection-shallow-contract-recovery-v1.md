# Development ledger — Skill Projection shallow checkout recovery

- Date: 2026-10-06
- Obligation: ci-control-plane-convergence-20261006-v1
- Predecessor: #3947
- Failure: post-merge Skill Projection run 37477223108 failed because the regression required `fetch-depth: 0`.
- Intended invariant: #3947 deliberately moved the workflow to `fetch-depth: 2`.
- Recovery: align the canonicalization regression with depth 2 and reject depth 0.
- Scope: test/evidence only; no runtime or provider mutation.
