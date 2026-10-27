# Bounded hypercoding wave admission — 2026-10-22

Obligation-ID: `powerhouse|parallel-wave-admission|bounded-epochs-settlement|20261022-v1`
Related canonical throughput owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661

## Why
The existing deterministic parallel engineering fabric could place arbitrarily many independent specialist packages into one wave. It also accepted mixed main epochs and returned early from a failing wave, leaving already-started sibling workers still executing outside the caller's observed completion barrier.

## Change
- Bound a concurrent work wave to `scheduling.max_parallel_packages=4` (validated integer 1..6) using the existing tuning baseline, without changing required CI or adding a dispatcher.
- Reject candidate groups with inconsistent main/base SHA before any speculative integration or work execution.
- Settle every in-flight worker before recording a failed wave; preserve exact failed and completed package IDs for the existing Brain/incident learning route. Never execute dependent waves after a failure.
- Prevent concurrent writers on the same exact candidate head or obligation, even if changed paths differ; verify the cap again at executor admission.
- Merge the non-overlapping safety improvements of competing PR #4708 into this canonical candidate. Preserve its failed Required evidence and retire the duplicate only after the integration commit is verified.
- Keep path/contract/resource conflicts, targeted tests, BG169 protection, CodeQL and production readback intact.

## Verification
`node --test tests/brain-parallel-engineering-fabric.test.mjs` and `node scripts/brain/parallel-engineering-fabric.mjs --check`.
These are proposed test commands, not locally executed or observed passing in this connector-only session. Exact-head Required/CodeQL, protected merge, live readback and measured speed gains remain **unproven** until real evidence is recorded.

## No duplicate authority
Reuse the existing parallel-engineering planner, Powerhouse CI Intelligence, daily self-evolution, writer leases, shared Brain failure registry and skill projection. Do not open extra schedulers, queues, database branches or bypass security.
