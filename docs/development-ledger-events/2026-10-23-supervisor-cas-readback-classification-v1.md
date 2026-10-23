# Native CAS rejection classification in canonical telemetry — 2026-10-23

- Parent/lineage: #4661, PR #4795; merged canonical supervisor evidence and ranking already on main.
- One owner: existing Recovery Supervisor and the SAME existing hourly Repository Janitor.
- Regression: tests/brain-recovery-supervisor-telemetry-v1.test.mjs and original supervisor suite.
- Error evidence: numeric HTTP status plus independently observed PR-head; changed head alongside 422 still does not prove causal explanation.
- Existing collected annotation categories gain a typed, deduplicated native rejection; no second log collector.
- Admission state at candidate creation: protected Required/CodeQL, actual main, hourly runtime and production readback pending.
- Preserve one writer, native expected-head CAS, two-attempt limit, Required, CodeQL and independent release validation.
- Release cycle speed improvement remains UNMEASURED until comparable protected production release cohorts.
