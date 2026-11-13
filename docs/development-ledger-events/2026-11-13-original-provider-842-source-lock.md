# Original Supabase provider applied-842 source-lock event

Owner: original Supabase GitOps / BRAIN delivery migration-source authority. Parent #4198. Root cause: real 842nd production migration applied after #5721 merged but original source-lock remained at 841. Affected original candidate #5724 failed source/preflight parity, including 841 vs 842; its 830 migration MUST NOT be predeclared applied.

Primary readback 2026-11-13T08:46:04.242Z: exact first 841 version/name pairs matched immutable source lock; actual 842nd: 20261113082500 original_cancelled_social_learning_source_ack_v1. Repair is append-only modification of existing source lock, not DB mutation. Proposed source-only PR requires independent CI/protected merge and subsequent real main+provider parity check.

Detection: `SUPABASE_PREVIEW_ROOT_CAUSE=MIGRATION_HISTORY_DRIFT`, Required preflight `842 !== 841`. Prevention: distinguish source-lock parity from provider migration apply, serialize original GitOps owner, never pass a candidate migration (830) as applied. Regression: tests/brain-original-provider-842-source-lock-20261113.test.mjs. Outcome: SOURCE_CANDIDATE until complete actual protected release and independent readback; customer/publication/learning outcome remains unchanged.
