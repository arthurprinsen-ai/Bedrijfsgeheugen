# Development ledger — bounded main drift CAS
Date: 2026-10-23

- Fingerprint: `github|recovery-supervisor|unguarded-main-drift-merge|20261023-v1`
- Obligation: `github|recovery-supervisor|native-head-cas-bounded-drift|20261023-v1`
- Owner: existing Powerhouse Delivery Recovery Supervisor
- Change: native GitHub `expected_head_sha` update, per-PR attempt cap, asynchronous ancestry reconciliation, fail-closed stale reads
- Files: existing Recovery Supervisor workflow and its test, one Brain learning record, this append-only ledger entry, one change document
- Negative controls: no second scheduler, no competing writer, no new database, no direct protected-main write, no bypass of Required/CodeQL
- State: CANDIDATE; exact-head CI, protected merge and supervisor production readback required
- Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4120
