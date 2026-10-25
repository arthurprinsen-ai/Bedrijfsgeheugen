# Archived tenant identity and MKB trigger source-contract repair — 2026-10-22

**Fingerprint:** `ci|brain|archived-sql-readpath|tenant-trigger|20261022-v1`  
**Owner/obligation:** `ci-brain-archived-tenant-trigger-test-sourcing-20261022`  
**Parent:** #3742; dependent acceptance #4215.

## Root cause and exact evidence
Unified BRAIN run [#39791707071](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071) reported 3,526 tests, 3,171 successful and 355 failed. Two inherited Node source-contract test modules still read deleted executable migration files. The original security-sensitive SQL is preserved verbatim in `supabase/migration-history/repository-only/` (blobs `a6037047760fe281ab24298f9f7d94c62cc95695`, `322fee022b78584346f1970e290e7cf763a1147a`). All original assertions were prechecked against these archived bytes.

## Contained repair
Only two historical file-read paths change. All existing assertions are preserved. Each source-contract file gains a regression case rejecting any duplicate runnable SQL migration; tenant browser-role revocation and service-role-only grant and MKB internal-only outreach remain unchanged. No production runtime, SQL schema, workflow, cron, provider, ACL, RLS, data or customer write changed.

## Immutable closure gates
Node two-file historical replay, exact-head Required and CodeQL, independent full BRAIN zero failures, supported Supabase clean-room replay/parity (#3742), protected merge and product acceptance (#4215) must each pass before any whole-system green claim. Never restore old runnable SQL to satisfy a missing file or relax a security assertion. Existing incident knowledge and shared green-assurance skill stay authoritative; no second error register, scheduler or executor.
