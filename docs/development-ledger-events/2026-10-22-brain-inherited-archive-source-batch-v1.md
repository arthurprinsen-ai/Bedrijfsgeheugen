# 2026-10-22 — BRAIN historical SQL archive test-source correction

- Obligation: `ci-brain-inherited-archive-batch-20261022`; parent #3742, downstream portal #4573/#4215.
- Baseline evidence: Unified BRAIN #39671036043; 3,511 tests, 3,190 pass, 321 fail.
- Original main epoch: `54ed4ffcad4e27a1c0c8ea189a39818246b537df`.
- Root cause: inherited tests use retired paths in `supabase/migrations/` despite authenticated original immutable Git SQL under `supabase/migration-history/repository-only/`.
- Remediation: seven test read-path changes only; seven explicit source identity regressions. All original assertions retained.
- Source-readback: seven distinct archived SQL Git blobs confirmed; selected positive and negative historical security markers checked.
- Safety: no executable SQL, permissions, providers, scheduler, production code or tenant data modified.
- Candidate state: NOT_YET_TESTED exact HEAD; no merge, production or acceptance-green claim.
- Follow-up evidence gate: targeted regressions + complete 0-failure BRAIN + exact-head Required/CodeQL, independent schema-history parity and real customer A/B acceptance.
