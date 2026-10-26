# System Map integrity — delivery event 2026-10-25

Obligation: `system-map-merge-integrity-20261025` · PR #4934.

Source changes: fail-closed System Map consistency script, corresponding delivery tests and agent-skill inheritance. Earlier Required failures showed (1) missing machine PR metadata, (2) unclassified test file, and (3) absent same-lineage closure artifacts. The first two were corrected; this event documents the third without asserting CI success. Canonical existing System Map integration branch `fix/system-map-4916-exact-head-writeback-20261025` retains terminal integration ownership. Next actions: verify generator invocation, integrate on one owner, exact-head Required/BRAIN/CodeQL and independent post-merge readback. No production success asserted.


## Local cause-directed recovery — 26 October 2026

This is a local, uncommitted recovery candidate for the existing obligation, not production evidence. The old PR head is `0fdda5a23e2b7b0fe0925dc2c6061bb440410ec4`; integrated observed main was `76afbb94f6526ed0ccccebd35ab27ccbba604f2c`. Subsequent main movement must be reconciled before publishing.

The three-way merge preserves both AGENTS sections and all main changes. The Required workflow merges cleanly. Generated System Map inventories and hash are regenerated from the combined tree; no conflict markers remain. Automation's four stale terminal-closure oracles now exercise canonical non-runtime classification and retired-migration adoption checks; the WIP assertion recognizes the existing cap of one. No workflow/security policy is weakened.

Backend source-only repair changes 98 literal references in 84 test modules from missing executable migration files to the existing immutable repository-only archive. SQL bytes and original assertions are unchanged. The tenant-identity/RLS suite now passes. No executable migration is restored, moved, or applied.

Observed local validation: Automation **325/325 pass**; full Backend **4212 pass / 280 fail / 4492 total**; integration/freshness/tenant checks **11/11 pass**. The old hosted Backend run had 4265 tests; its 378 failures are not directly comparable to this newer integrated tree. Remaining failures include stale workflow/source oracles, missing canonical migration references, stale migration-history evidence, and expired model-catalog source verification. They remain release-blocking.

Read-only production provider observation found PostgreSQL 17.6, 755 applied migration identities, and existing `writer_control.acquire/verify/release` functions. No lease has yet been acquired by this candidate; no external code-write, protected merge, deploy, or independent release readback has occurred. Original GitHub run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40319645570

## Supplemental recovery — 2026-10-26

Preserve existing published head 064246a86 and its Automation/security cases. Repair ten further SQL-source paths only where Git records a byte-identical R100 rename and the current target matches a historical source blob. Align two workflow tests with current diagnostic job names and the protected aggregator including PostgreSQL 17 replay; no workflow, production SQL or security assertion is removed. Local Automation 325/325 and System Map tests 12/12 passed. Full Backend before final rename repair: 4213/4492 passed, 279 failed. This remains an incomplete recovery: all remote final-SHA gates, protected merge and independent production readback are required.

Final local checkpoint `20ee395199da4320f05eedd1067aff5e48e6515a`: Backend 4243 passed, 271 failed, 4514 tests; no skips. Remaining failures are release-blocking. This checkpoint differs from the preserved remote parent in two equivalent terminal test cases and local evidence only; remote exact-head verification remains required.

## 2026-10-26 — GitHub Actions execution continuation

PR #4942 merged as a34505e17833852c1e8d4c005fb5ee7ca37f918a and Netlify published that source. Its full BRAIN backend run40327544510 remains failed with271 failures. A successful Required subset is not a substitute for that full suite.

Continue the same obligation from current main using the existing writer_control.acquire/verify/release and native expected-head updates. Repair the duplicate Janitor branch path and serialize existing jobs, explicit public locale navigation, and provider-backed migration history. Fresh read-only provider snapshot records755 identities and preserves all634 prior lock identities. Three absent already-applied SQL sources are mirrored byte-for-byte from the provider's stored statements; no SQL execution or security exemption is introduced. Historical ledger checks retain immutable snapshot hashes and account for the provider's later backfill.

The local runtime became unavailable. Publication and all further test evidence use the existing GitHub Actions checkouts; no local prior pass is counted as success on this candidate. Required, PostgreSQL17, complete BRAIN, CodeQL, provider preview/replay, deterministic System Map regeneration, protected merge and independent production readback remain mandatory. No terminal or live claim.

## GitHub Actions phase2 — source-backed contract recovery

Parent40144e48: CodeQL, PostgreSQL17, preflight, Netlify build, Supabase source contract and provider preview pass. Full BRAIN40337302217 remains failed in Backend. No passing Required subset is treated as full BRAIN proof. Correct test oracles for actual build phases, stronger contact-review/typed-JSONB guards, provider identity and atomic claim boundaries. Keep the retired duplicate sender read-only. Add complete redacted failure metadata and bounded machine-readable annotations to the existing failed-lane producer, because the log connector rejects the oversized raw log. Full artifacts remain intact; annotation truncation is explicit, never a success or release waiver. All mandatory checks must rerun on the new SHA; no production claim.
