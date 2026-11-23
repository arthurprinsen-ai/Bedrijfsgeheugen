# Preserve evidence evaluation timestamp for repeated writes

The active `revenue-learning-store` Edge Function unconditionally sends `updated_at` with each upsert. If the record has not materially changed, `list_due_evidence` nevertheless interprets the newer timestamp as fresh evidence and re-evaluates it.

PR #5019 proposes a single PostgreSQL `BEFORE UPDATE` trigger. For unchanged business fields it restores the old `updated_at`, returning the row so the existing single-item API keeps working. For changed business fields it retains the new timestamp. This guards against unnecessary *reevaluation*, not against the physical database update itself.

Tests so far: 4/4 isolated PostgreSQL timestamp/return tests passed on a temporary table within a transaction that was rolled back. Not yet proven: concurrent writes, the complete target-table contract, other triggers/auditing/CDC, full CI, migration history, protected merge, or production readback. This change is **NOT LIVE** and must go through the canonical protected database migration process. Immutable provenance still needs independent enforcement.
