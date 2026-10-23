# One-organism CI evidence reconciliation

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
- Owner: `engineering|cicd|canonical-source-reconciled-semconv|20261023-v1`.
- Existing authoritative collector: hourly Powerhouse Repository Janitor.
- Detection: semantic task sample could diverge from the canonical parser on future parser updates.
- Recovery: reconcile exact task identifiers/commit/result/elapsed evidence; mismatch suppresses semantic records.
- New providers, schedules, queues, agents, databases, data exports: none.
- Tests: `tests/brain-ci-canonical-semconv-parity-v1.test.mjs` and existing CI throughput regressions.
- Reuse: specialist agents can investigate only `canonical_reconciled=true` provider-backed samples.
- Release: no production claim until exact-head protected CI and independent existing-artifact readback.
- Outcome: no measured speedup or business value from this code alone.
