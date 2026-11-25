# 2026-11-24 — reviewed writer execution epoch proposal

Fingerprint: delivery|reviewed-writer-execution-epoch|20261124-v1

Observed native #5940 conflict and old base; protected approval changes main. Staged read-only validator and regressions as review candidate for the original #4661 owner. No production change, write permission, manifest approval or incident closure. Original deny-all policy remains. Evidence and acceptance: docs/changes/2026-11-24-reviewed-writer-epoch.md.

## Native preflight integration — 25 November 2026

Original authorized writer entrypoint now independently reads protected revision manifest/policy bytes from the native GitHub adapter, validates exact repository, main ref, PR and obligation, verifies exact comparison ancestry and checks checkout/current-main identities. A v2 manifest only reaches read-only preflight and explicitly stops before lease acquisition or CAS. The v1 route is unchanged; deny-all policy and missing manifest remain untouched. 44/44 isolated tests passed, including six native HTTP mock tests and 24 existing v6 regressions. The exact-SHA compare route permits its literal triple-dot separator only; traversal and alternate origin remain denied. This is an integrated preflight candidate, not a real-provider or production-write authorization. Full two-parent scoped tree, fenced expected-head CAS, native provider proof and protected review are still required.

## Reviewed full-tree preparation — 25 November 2026

The same candidate adds a local Git object preparation stage. It binds the exact approved raw manifest digest to preflight, requires declared and actual candidate scope equality, preserves current main outside scope, preserves disjoint candidate changes, requires explicit reviewed bytes for each overlap, rejects protected paths and file/directory collisions, and independently checks full resulting tree and ordered candidate/main parents. No ref moves or provider writes. Six real local Git tests plus previous 44 tests pass (50/50). Actual protected checkout/fetch integration and native fenced CAS transport remain open. No production or provider authority claim.
