# 2026-11-15 | ONE BRAIN backfill full-history pagination

- Original P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Source defect: `tools/outcome-obligation-supabase-store.mjs::listDispatch` single unpaginated select, consumed by `tools/outcome-obligation-completion-supervisor-backfill.mjs::collectCompletionBackfillSnapshot`.
- Independent native SQL source: 3313 AgentWork/PENDING, 1055 RecoveryWork/RECOVERING; 14 INNOVATION_INTAKE/PLANNED, 387 CONTENT_HANDOFF/OPEN; original 4/4 jobs active. REST first-page loss is a source risk, *not* evidence of actual provider duplicate or missing execution.
- Same original reader now requires exact PostgREST Content-Range and stable created_at+immutable idempotency-key pagination for the full source; aborts on count drift, duplicate, wrong type, invalid/missing range or unbounded pages.
- Historical data untouched. Same original owner, registered Reliability/Data Quality tasks, original recovery skill and same protected CI/CD. No parallel worker, scheduler, external sender, table, migration or provider billing.
- Executable regressions in `tests/brain-outcome-obligation-supabase-store.test.mjs`. Machine record `brain/learning/2026-11-15-immutable-dispatch-full-history-pagination-v1.json`. Human explanation `docs/changes/2026-11-15-immutable-dispatch-full-history-pagination.md`.
- Next proof: exact-head Required + CodeQL; protected merge; exact production Netlify READY; next natural original full-history sweep must independently read native counts and real consumer/effect receipts. Parent incident remains OPEN until original outcomes verified.
