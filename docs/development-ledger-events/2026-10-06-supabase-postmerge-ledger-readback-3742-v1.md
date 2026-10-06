# 2026-10-06 — #3742 post-merge migration-ledger readback

- Canonical recovery PR #3766 merged as `ccdf134ca4de73e547e54c9de00298d771f87be5`.
- Provider repair run `37426469433` successfully repaired exactly four allowlisted migration versions and proved immediate zero drift.
- Direct Supabase MCP readback later timed out, so terminal closure still lacked an independent post-merge ledger proof.
- Existing OIDC trusted workflow is extended with non-mutating post-merge readback mode.
- Readback mode requires: merged #3766 contained in main; `REPAIRED_APPLIED_VERIFIED` lock states; 568 migration-list rows; zero drift; all four repaired versions remote=local.
- Readback mode skips lock/PR mutation and uploads immutable evidence.
