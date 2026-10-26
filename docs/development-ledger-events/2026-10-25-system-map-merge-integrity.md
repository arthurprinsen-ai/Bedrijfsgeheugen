# System Map integrity — delivery event 2026-10-25

Obligation: `system-map-merge-integrity-20261025` · PR #4934.

Source changes: fail-closed System Map consistency script, corresponding delivery tests and agent-skill inheritance. Earlier Required failures showed (1) missing machine PR metadata, (2) unclassified test file, and (3) absent same-lineage closure artifacts. The first two were corrected; this event documents the third without asserting CI success. Canonical existing System Map integration branch `fix/system-map-4916-exact-head-writeback-20261025` retains terminal integration ownership. Next actions: verify generator invocation, integrate on one owner, exact-head Required/BRAIN/CodeQL and independent post-merge readback. No production success asserted.


## Local cause-directed recovery — 26 October 2026

This is a local, uncommitted recovery candidate for the existing obligation, not production evidence. The old PR head is `0fdda5a23e2b7b0fe0925dc2c6061bb440410ec4`; integrated observed main was `76afbb94f6526ed0ccccebd35ab27ccbba604f2c`. Subsequent main movement must be reconciled before publishing.

The three-way merge preserves both AGENTS sections and all main changes. The Required workflow merges cleanly. Generated System Map inventories and hash are regenerated from the combined tree; no conflict markers remain. Automation's four stale terminal-closure oracles now exercise canonical non-runtime classification and retired-migration adoption checks; the WIP assertion recognizes the existing cap of one. No workflow/security policy is weakened.

Backend source-only repair changes 98 literal references in 84 test modules from missing executable migration files to the existing immutable repository-only archive. SQL bytes and original assertions are unchanged. The tenant-identity/RLS suite now passes. No executable migration is restored, moved, or applied.

Observed local validation: Automation **325/325 pass**; full Backend **4212 pass / 280 fail / 4492 total**; integration/freshness/tenant checks **11/11 pass**. The old hosted Backend run had 4265 tests; its 378 failures are not directly comparable to this newer integrated tree. Remaining failures include stale workflow/source oracles, missing canonical migration references, stale migration-history evidence, and expired model-catalog source verification. They remain release-blocking.

Read-only production provider observation found PostgreSQL 17.6, 755 applied migration identities, and existing `writer_control.acquire/verify/release` functions. No lease has yet been acquired by this candidate; no external code-write, protected merge, deploy, or independent release readback has occurred. Original GitHub run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40319645570
