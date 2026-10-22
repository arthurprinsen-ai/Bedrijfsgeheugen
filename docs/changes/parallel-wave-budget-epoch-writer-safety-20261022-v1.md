# Bounded autonomous parallel engineering — 22 October 2026

Obligation-ID: `delivery|parallel-wave-budget|epoch-writer-safety|20261022-v1`  
Related canonical delivery ownership: #4661; predictive controller work remains in #4663.

## Failure and safety finding
The existing `scripts/brain/parallel-engineering-fabric.mjs` can schedule all independent ready packages in one unbounded concurrent wave. Different main epochs, identical candidate-head writers and the same obligation are not independently classified as conflicts. This is a preventive hardening candidate, **not evidence of an observed production outage**.

## Change
- Set policy `max_concurrent_work_packages_per_wave=4` (absolute input bound 1–6). Independent agents still execute concurrently, but excess work is split into deterministic next waves.
- Require compatible base epochs; serialize same obligation or candidate SHA regardless of disjoint paths.
- Check the cap again at execution, including callers that supply a plan manually.
- Preserve deterministic affected-test selection, cache evidence, Required/CodeQL, BG169 merge, security, provider receipts and production readback; add no new scheduler or memory store.

## Verification and learning
Run `node --test tests/brain-parallel-engineering-fabric.test.mjs` and `node scripts/brain/parallel-engineering-fabric.mjs --check` plus protected exact-head Required/CodeQL. This PR remains **CANDIDATE** until protected merge and production readback. Measure queue wait, critical-path latency and runner minutes from real samples before claiming a speedup. Fingerprint: `delivery|parallel-wave-budget|epoch-writer-safety|20261022-v1`.
