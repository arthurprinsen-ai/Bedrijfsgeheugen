# 2026-11-24 — reviewed writer execution epoch proposal

Fingerprint: delivery|reviewed-writer-execution-epoch|20261124-v1

Observed native #5940 conflict and old base; protected approval changes main. Staged read-only validator and regressions as review candidate for the original #4661 owner. No production change, write permission, manifest approval or incident closure. Original deny-all policy remains. Evidence and acceptance: docs/changes/2026-11-24-reviewed-writer-epoch.md.

## Native preflight integration — 25 November 2026

Original authorized writer entrypoint now independently reads protected revision manifest/policy bytes from the native GitHub adapter, validates exact repository, main ref, PR and obligation, verifies exact comparison ancestry and checks checkout/current-main identities. A v2 manifest only reaches read-only preflight and explicitly stops before lease acquisition or CAS. The v1 route is unchanged; deny-all policy and missing manifest remain untouched. 44/44 isolated tests passed, including six native HTTP mock tests and 24 existing v6 regressions. The exact-SHA compare route permits its literal triple-dot separator only; traversal and alternate origin remain denied. This is an integrated preflight candidate, not a real-provider or production-write authorization. Full two-parent scoped tree, fenced expected-head CAS, native provider proof and protected review are still required.

## Reviewed full-tree preparation — 25 November 2026

The same candidate adds a local Git object preparation stage. It binds the exact approved raw manifest digest to preflight, requires declared and actual candidate scope equality, preserves current main outside scope, preserves disjoint candidate changes, requires explicit reviewed bytes for each overlap, rejects protected paths and file/directory collisions, and independently checks full resulting tree and ordered candidate/main parents. No ref moves or provider writes. Six real local Git tests plus previous 44 tests pass (50/50). Actual protected checkout/fetch integration and native fenced CAS transport remain open. No production or provider authority claim.

## Fenced reviewed CAS boundary — 25 November 2026

Same review candidate now binds prepared tree to the raw approved manifest digest, verifies exact two parents, candidate identity and independently read exclusive provider reservation, acquires original writer_control lease for the execution main, rechecks lease and slot revision before one exact-head CAS adapter invocation, then requires independent branch/commit/main readback. It refuses shadow evidence, common Actions app identity, missing native bypass prevention, lost lease and changed reservation. A concurrent head change denies CAS; post-write main movement is reconcile-only, never automatically retried or claimed live. 57/57 combined regressions pass (7 new mocked orchestration cases). The new boundary is not connected to the production entrypoint: provider-enforced reservation and actual native exact-CAS transport remain unproven. No approved manifest, policy expansion, production writes, new scheduler or altered original owners. Existing deny-all remains.

## Native Git receive-pack exact CAS transport — 25 November 2026

Same candidate adds a pinned canonical GitHub transport with an explicit expected-old-object lease and an exact two-parent forward commit; no tracking-ref lease, broad force, main write, retry or receipt for already-landed refs. Actual Git receive-pack on an isolated local bare repository proves success, stale ancestor denial, already-landed nonreceipt and invalid parent/branch denial. Independent native commit readback checks SHA, tree and ordered parents. 62/62 combined regressions pass, including four local Git protocol tests and one HTTP mock. The production entrypoint remains closed. Trusted isolated checkout, provider-enforced main-wide reservation, exclusive app identity and actual GitHub write/readback remain unproven. This does not change provider settings, approved paths, manifest, original owner or scheduler.
