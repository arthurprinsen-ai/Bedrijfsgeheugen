# Original Janitor archive provider reason — exact source truth

Date: 2026-11-03. Owner: existing Powerhouse Repository Janitor. Parent incident: #5333.

## Observed source/Brain discrepancy

Native original run [#41603524034](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41603524034), job 125809319702, main SHA `029c75ec42653d78648bd82fbcb6b4723c6d35f9`: three typed `CREATE_ARCHIVE_TAG` HTTP403 `PROVIDER_PERMISSION_DENIED` events and a correctly open three-denial circuit. Exact original ONE BRAIN occurrence `github-actions:janitor-archive:run:41603524034:attempt:1:signal:archive_provider_failure` was stored with `archive_reason=UNKNOWN_OR_OTHER`. This misclassification prevents trusted issue and portal diagnosis despite verified native evidence.

## One original-owner repair

In the existing `tools/delivery/janitor-incident-agent.mjs`, parse the original bounded `branch-archive-actions.ndjson` action log, accepting only structured `BRANCH_ARCHIVE_PARTIAL_FAILURE` events matching the exact run ID and source main SHA. A 403 reason is `PROVIDER_PERMISSION_DENIED` only for actual `CREATE_ARCHIVE_TAG` with `branch_deleted=false`. Preserve `PROVIDER_RATE_LIMIT_EXCEEDED` as a distinct root cause and `UNKNOWN_OR_OTHER` when native proof is incomplete or mismatched. No second runner, scheduler, table, repo permission, or wider token.

Regression: `tests/brain-janitor-archive-incident-readback-20261103.test.mjs` replays native and mismatched source actions, verifies persisted ONE BRAIN reason and preserves safe unknown. Existing fail-closed branch deletion and three-strike guard remain unchanged.

## Release / proof conditions

Require canonical learning historical+shadow+canary, Required/CodeQL/full BRAIN on exact head, protected merge, original native Janitor run and independent GitHub+ONE BRAIN readback. Native GitHub tag-write HTTP403 in #5333 and four orphan zero-job runs #4655 remain open until actual GitHub provider resolution. Do not mark global-green or portal-live based on a projected reason field alone.
