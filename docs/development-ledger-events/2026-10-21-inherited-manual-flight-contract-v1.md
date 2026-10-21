# 2026-10-21 — BRAIN inherited diagnostic workflow contract repair

- Obligation: `ci-inherited-manual-flight-contract-v1`; fingerprint `ci|inherited-baseline|manual-workflow-single-flight-contract|v1`.
- Existing-state: main `8f322681ba46045e5d65746c2b2f0fd5b40ffac1`, BRAIN run `39554866582`, 355 inherited failures; no portal candidate-only failed identity established.
- Root cause for one failure: static test expected retired `jobs.test` and PR-only concurrency while canonical workflows are manual diagnostic and use current job keys/ref-scoped single-flight.
- Change: strengthen/realign existing test with manual-only invocation, no PR/push fanout, actual job names, ref-scoped concurrency, cancellation and timeout.
- No DDL, migrations, source workflow, production mutation, external post or security relaxation.
- Verification: new exact-head full CI not yet observed; full production and customer acceptance remain open in #3742/#4215.
