# Original social-learning cohort source-evidence ledger — 2026-11-12

- Fingerprint: `powerhouse|social-learning|unverified-snapshot-allowed-in-comparison-cohort|20261112-v1`
- Owner: original `social-learning-store` and hourly `social-learning-evaluate`, under #4198
- Cause: the comparison cohort skipped exact source/identity/quality checks used for target windows
- Evidence: source readback from original main, production partial-only provider snapshots and current open obligations; these observations alone do not prove that past learning decisions were wrong
- Fix candidate: gate each cohort snapshot on source, original tenant/post, external provider identity, numeric metric and exact actual 24/48/72h ±6h timestamp
- Test: `tests/brain-social-obligation-evidence-ack-20261110.test.mjs` source-positive, source-negative and Edge-callsite regression
- Release: CANDIDATE_PENDING_PROTECTED_REQUIRED_CODEQL_DEPLOYMENT_AND_PRODUCTION_READBACK
- Prevention: never count missing, partial, wrong-tenant or wrong-provider metrics as comparison samples; keep original unresolved measurements OPEN
- No second scheduler/provider/publisher and no manufactured impact, revenue or provider receipts
