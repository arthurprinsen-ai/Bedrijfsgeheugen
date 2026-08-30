# Shared-memory contract versioning — 2026-08-30

Fingerprint: `shared-memory|contract-test|minor-version-brittleness-after-merge`

## Failure

A pull-request candidate was fully green on its exact head, but the post-merge `main` Shared Agent Memory suite failed after concurrent, non-overlapping learning had evolved the machine-readable Make credit-storm record from `MAKE-CONTROL-PLANE-CREDIT-STORM-v1` to backward-compatible `v1.1`. The regression test had pinned the exact `v1` string even though the stable fingerprint, guard and safety invariants were unchanged.

## Root cause

The contract test confused a stable major contract family with an evolvable minor schema revision. Exact-head PR CI therefore did not detect the integration incompatibility that only existed after combining the candidate with newer canonical learning on `main`.

## Proven prevention contract

- PR exact-head green is necessary but not sufficient for shared-memory changes when canonical learning can advance concurrently; post-merge `main` Shared Agent Memory CI is a separate mandatory integration gate.
- Tests for evolvable machine-readable learning must pin stable fingerprints, guard IDs, safety invariants and major contract family exactly.
- Backward-compatible minor versions may be accepted when semantics and safety boundaries remain compatible; do not pin an exact minor version unless that minor itself changes required behavior or safety.
- Major version changes remain fail-closed and require explicit migration/review.
- Moving `main` with non-overlapping changes does not require rebuilding unrelated lanes before merge, but the resulting integrated `main` must still pass the shared-memory suite.
- A merge is not completion evidence. If post-merge integration CI is red, immediately reopen the repair loop and record the new failure before claiming completion.

## Regression evidence

Observed failing integration run: Shared Agent Memory Tests on merge SHA `3e89d3ef28459f63e7b6d44740f4e45ff25b6717` produced 147 tests, 146 pass and 1 fail. The sole failure expected `MAKE-CONTROL-PLANE-CREDIT-STORM-v1` while canonical state contained `MAKE-CONTROL-PLANE-CREDIT-STORM-v1.1`.

Minimal repair: accept `MAKE-CONTROL-PLANE-CREDIT-STORM-v1` plus backward-compatible `.N` minor revisions while retaining exact assertions for the stable fingerprint, guard and safety invariants.
