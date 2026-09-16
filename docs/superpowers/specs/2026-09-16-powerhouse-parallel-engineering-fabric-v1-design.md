# Powerhouse Parallel Engineering Fabric v1 — Design

Fingerprint: `powerhouse-parallel-engineering-fabric-v1`
Status: approved for implementation
Date: 2026-09-16

## Purpose
Accelerate Bedrijfsgeheugen Powerhouse engineering without creating a second delivery authority. The fabric extends `BRAIN-DELIVERY-v2` and `powerhouse-engineering-os-v1` with deterministic work decomposition, dependency-aware concurrency, affected-test selection, cache identities, speculative integration planning and merge-order decisions.

## Non-negotiable architecture
- `BRAIN-DELIVERY-v2` remains delivery authority; BG169 remains production promotion authority.
- Existing GitHub, Netlify, Supabase, Brain shared-context/outcome/learning authorities are reused.
- No new persistent queue, scheduler, database, CRM, Brain or Make dependency.
- Parallelism is allowed only for work packages without path, conflict-contract or declared dependency overlap.
- Every work package has one owner, explicit read/write scope, exact base/candidate identity, required tests and rollback identity.
- Changed paths resolve deterministically to affected lanes/contracts. Unknown material scope fails closed.
- Fast-path tests never replace required release/security/production evidence; they reduce redundant pre-merge work only.
- Deterministic cache keys may reuse only results with identical source/dependency/toolchain/test-policy inputs.
- Speculative integration predicts compatible combinations but cannot promote untested candidates.
- Production completion remains `LIVE & BEWEZEN` only after exact-candidate production readback plus learning/writeback.

## Runtime components
1. `scripts/brain/parallel-engineering-fabric.mjs`: pure orchestration primitives and CLI.
2. `config/powerhouse-engineering-os.json.parallel_engineering`: canonical policy and guardrails.
3. `tests/brain-parallel-engineering-fabric.test.mjs`: deterministic scheduling, affected testing, cache and fail-closed regression contract.
4. Required CI wiring: the new contract test must execute inside `.github/workflows/required-test.yml`.
5. Human documentation in `docs/development-operating-system.md` linking the new fabric to existing delivery authority.

## Work-package model
Input fields: `id`, `component`, `paths`, optional `dependsOn`, `contracts`, `risk`, `baseSha`, `candidateSha`.
Output fields: owner lane, affected contracts, affected test profiles, concurrency group, cache identity, speculative integration eligibility and blocking reasons.

## Scheduling algorithm
Build a directed acyclic graph from explicit dependencies. Two ready packages may execute concurrently only when their changed paths do not overlap, their resolved conflict contracts do not overlap and no dependency edge connects them. Deterministic ordering is lexical by work-package id so repeated runs produce the same plan.

## Affected testing
Each changed path is matched to existing delivery lanes/conflict contracts plus canonical test profiles. Shared control-plane changes require the full protected control-plane profile. Unknown material paths fail closed. Documentation-only paths may use a minimal documentation profile only when they are already classified as non-executable shared paths.

## Caching
Cache identity is a stable SHA-256 hash over sorted changed paths, affected contracts, selected tests, exact base/candidate identities and policy version. Cache reuse is advisory and never skips exact-candidate production verification.

## Speculative integration
For currently independent ready packages, emit safe combination candidates in deterministic order. Combinations are planning evidence only. Integration/merge still requires protected CI against the exact candidate set.

## Error handling
Cycles, missing dependency targets, unknown material paths, absent exact identities, or ambiguous ownership produce fail-closed errors. No orchestration error weakens security, schema, tenant, production or rollback gates.

## Acceptance evidence
- RED contract test proves missing fabric implementation.
- GREEN unit/contract tests prove deterministic scheduling, conflicts, affected tests, cache stability, speculative combinations and fail-closed behavior.
- Required workflow executes the new test.
- Protected PR gates pass on exact head.
- Protected merge lands on `main`.
- Post-merge workflow/readback verifies the merged SHA and documented canonical authorities.
- Learning/development ledger writeback records the change and prevention rule.
