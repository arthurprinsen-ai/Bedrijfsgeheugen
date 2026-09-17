# Powerhouse Learning — Engineering Intelligence & Trust v1

**Fingerprint:** `engineering-intelligence-trust-v1-learning-closure`
**Canonical parent:** `BRAIN-DELIVERY-v2`
**Production authority:** `BG169`
**Error lineage:** `BG166`
**Current-state projection:** `BG167`
**Outcome/learning lineage:** `BG168`
**Release PR:** #1749
**Candidate SHA:** `67f84443094368fc74687580793d617eaf46e54d`
**Merge SHA:** `81135b67e90c0ebddec427da860b71b1ee98c44e`
**Lifecycle:** `LEARNED`

## Context / problem
The Engineering OS already had strong exact-SHA delivery, Brain contracts, release gates and production verification, but lacked one coherent machine-verifiable layer for software supply-chain provenance, isolated candidate identity and engineering-flow intelligence. The risk was fragmented proof: a green workflow could otherwise say too little about which artifact, database candidate, preview, tests and rollback evidence belonged to the exact promoted SHA.

## Root cause
The missing capabilities were maturity gaps above the existing delivery kernel, not a missing delivery system. Building a second Engineering OS, second analytics store or second learning loop would have created authority drift. The correct solution was therefore to extend `BRAIN-DELIVERY-v2` and its BG166/BG167/BG168/BG169 lineage.

## Implemented solution
Engineering Intelligence & Trust v1 adds, within the existing Powerhouse architecture: CODEOWNERS and dependency lifecycle automation; CodeQL/dependency review; SBOM and build provenance; immutable candidate identity across PR/Git/Netlify/Supabase/schema/artifact/evidence; Supabase PR-preview contract; graph-driven test selection plus safety kernel; flaky-test intelligence; performance/cost baseline-and-ratchet governance; rollback/recovery proof; work graph/lease/conflict primitives; and an Engineering Scorecard projection from existing Brain/CI evidence.

## Evidence
PR #1749 is merged. Exact candidate head was `67f84443094368fc74687580793d617eaf46e54d`; protected merge produced `81135b67e90c0ebddec427da860b71b1ee98c44e` on main. Production verification associated with the release established exact-SHA Netlify/readback and canonical CurrentState/Learning persistence before the release was classified `LIVE & BEWEZEN`.

## Reusable learning / prevention rules
1. Artifact identity is not implied by Git identity: promotable candidates require digest/provenance tied to exact tested SHA.
2. Candidate evidence must be identity-coherent: frontend/backend/DB/schema/preview/artifact evidence from different candidates fails closed.
3. Do not create a parallel Engineering OS; extend BRAIN-DELIVERY-v2 and existing Brain lineage unless a missing authority is proven.
4. Historical debt uses measured baseline + ratchet; new regressions fail closed immediately.
5. Smart test selection always retains a safety kernel; unknown paths fall back conservatively.
6. Retries may not hide flaky behavior; reliability/fingerprints/ownership stay observable and feed learning.
7. Rollback readiness is release evidence, not optional documentation.
8. Engineering telemetry is a projection from canonical CI/Brain evidence, never a second source of truth.
9. Supply-chain trust remains inside Required/Assurance and cannot be downgraded to optional documentation.
10. Structural engineering changes close the loop: detect → evidence → root cause → test → fix → exact candidate proof → protected promotion → production readback → state/outcome writeback → reusable prevention.

## Regression fingerprints
`artifact-sha-mismatch`, `candidate-environment-identity-mismatch`, `preview-db-drift`, `silent-flaky-retry`, `performance-ratchet-regression`, `rollback-proof-missing`, `work-graph-authority-conflict`, `engineering-telemetry-parallel-authority`.

## Authority note
This file is a human-readable projection. Future agents must read current runtime/code/database authority and active obligations first; newer verified state supersedes stale documentation.
