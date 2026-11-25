# Revenue-learning semantic timestamp guard — delivery event

- Obligation: `revenue-learning-evidence-unchanged-upsert-20261027`
- PR: #5019; change is a candidate migration, not a live fix.
- Cause: every repeated evidence upsert writes a new `updated_at`, reopening already evaluated records.
- Proposed prevention: preserve timestamp when business payload is identical while maintaining row-returning API contract.
- Evidence: four isolated PostgreSQL temp-table tests passed with ROLLBACK; CodeQL passed on initial PR head; Required failed first on missing metadata, then on missing canonical closure artifacts.
- Remaining: multi-session concurrency, canonical migration history, audit/CDC, all protected checks, merge, DB deployment, production readback.
- Security: no direct production SQL execution, no writer scope expansion, no duplicate executor or scheduler.
