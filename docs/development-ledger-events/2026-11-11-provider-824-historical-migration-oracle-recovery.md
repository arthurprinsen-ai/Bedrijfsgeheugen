# 2026-11-11 — historical migration tests falsely blocked real 824 provider ledger

Fingerprint: brain|migration|immutable-818-819-823-checkpoints-vs-current-824|20261111-v1
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Existing Supabase project: adhjwmvyoixzjtmiroln
Base-SHA: badf16895850de8769adc024faf0cad208b3d0ec
Delivery-Lane: backend
State: CODE_CANDIDATE pending protected CI and BRAIN terminal proof

## Observed incident and root causes
Production Supabase provider schema_migrations exact 824/824 IDs, protected Git source lock 824/824 full equality, latest 20261110160055. Historical prefix 818 on Nov 9, 819 after original handoff 07:35, 823 after original source-wait 13:45 all match their real provider checkpoints. BRAIN delivery run 42981444211 failed 5 backend tests: hardcoded **current** 818/819/823 expected counts vs actual 824; negative `existsSync(new URL(...))` parser missed nested parentheses; stale 14-day gpt-6-astra supplier evidence is a genuine independent hold.

## Repair / recovery and prevention
Use exact immutable *historical* version-bound prefixes for historic tests and independent exact current SQL→lock equality. Keep all negative tamper/preview controls of `verifyAlreadyApplied818HistoryReconciliation`. Recognize explicit false existsSync nested-URL assertions narrowly; truly missing SQL actually read by a test still fails closed. No provider ledger mutation, no new migration, no scheduler, no side effects, no fake external verification. Separate supplier freshness from migration parity.

Tests: `tests/brain-commercial-applied-provider-lock-20261110.test.mjs`, `tests/brain-provider-819-migration-lock-parity-20261110.test.mjs`, `tests/brain-verified-provider-818-history-reconciliation-20261109.test.mjs`, `tests/supabase-migration-reference-integrity.test.mjs`.

A merged branch or GitHub green is not yet proof of BRAIN all green; require protected source exact release readback and independent supplier data. Keep actual stale external provider evidence OPEN.
