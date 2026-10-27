# Engineering event — bounded parallel admission (2026-10-22)

- Fingerprint: `powerhouse|parallel-wave-admission|bounded-epochs-settlement|20261022-v1`
- Parent objective: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
- Baseline main: `6258ec1be551afebfb4d475c91394824047a2fdc`
- Existing authority: `scripts/brain/parallel-engineering-fabric.mjs`
- Causal defect: unbounded independent-wave fan-out, mixed epoch admission, early-failing Promise.all
- Repair: four-wide deterministic admission, fail-closed shared main epoch, await all active siblings on failure
- Tests: `tests/brain-parallel-engineering-fabric.test.mjs` (PENDING remote verification)
- Safety: no independent scheduler, runner, GitHub dispatch, security-gate weakening, or production promise
- Proof state: CANDIDATE only; exact-head Required, CodeQL, protected merge and runtime readback outstanding
- Benchmark: no p50/p95 or cost reduction claimed without measured runs
