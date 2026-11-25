# Append-only development ledger — original 15-loop assurance fault containment

Fingerprint: `powerhouse|15-loop|unisolated-handoff-fault-blocks-other-owners|20261111-v1`.
Owner: original P0 #4198 and linked Portal P0 #4215; no new executor.
Observed at 2026-11-11 09:18 UTC: #171 original cron active and recent calls SUCCESS, assurance 8/15 GREEN and 7/15 RED, content 433 OPEN of which 403 OVERDUE, two ESCALATED unknown-result original reconciliations.
Root cause class: unisolated original stage-sync and content-handoff helper calls before loop-owner iteration. This is a verified failure-containment design gap, **not** a claim that a helper exception occurred in these observed cron runs.
Correction candidate: preserve original RPC signature, SECURITY DEFINER and service_role-only permissions; wrap only two internal no-provider helpers as bounded exception subtransactions. Stage-sync failure -> all RED. Content-handoff failure -> content RED, other original loop checks continue. Use existing owner and BRAIN obligations, SQLSTATE only, no PII/duplicated writes.
Regression: `tests/brain-15-loop-assurance-isolated-failure-20261111.test.mjs`; learning `brain/learning/2026-11-11-original-loop-handoff-fault-isolation-v1.json`.
Source migration identity: `20261111093500_original_loop_assurance_fault_isolation_v1`. The 824-row provider-applied migration-history lock remains **unchanged** in this candidate; the new SQL file is only a proposed migration, never predeclared applied. Require protected CI, native provider migration-history parity and original cron readback before a LIVE claim.
Outstanding: historical content receipts, unknown provider results, auth two-tenant input→Brain→Powerhouse/Heartbeat, CRO treatment and measured learning EVIDENCE_DUE. Original P0 remains OPEN.

## Addendum 2026-11-11 native apply race / first exact original version
Operator observed native production 826 rows with two actual idempotent applied versions: 20261111093500 (3 statements, native auto-deploy) and 20261111094222 (single full-source statement, separate manual recovery). The original service_role-only SQL function was verified active; original #171 cron continued succeeding. First protected source/lock reconciliation records only 09:35 (825/826 intermediate). No native historical deletion, no second scheduler or duplicate provider output. Keep second version open for subsequent exact source PR and final 826 lock. Prevention: wait for native production deploy and read back source before any manual apply. Business outcome EVIDENCE_DUE.
