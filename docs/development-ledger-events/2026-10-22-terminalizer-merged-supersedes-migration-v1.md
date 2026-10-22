# Development ledger — 2026-10-22 — P0 #4681 terminal migration supersession

Parent: #4681. Existing Brain fingerprint: `brain|incident-observe|evidence-overwrite-and-crosswriter-runid-dup|20261022-v1`.
Controller: existing Powerhouse Obligation Terminalizer; no additional scheduler or error store.
Observed source: [run 39840439339](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39840439339), job 120039732278. The actual `SUPABASE_MIGRATION_PROVIDER_READBACK_PROVEN:20261022173500` completed before `UNMERGED_SUPERSEDES_HAS_SUPABASE_MIGRATIONS:4686`.
Causal defect: unconditional rejection of SQL in CLOSED/UNMERGED superseded PR, despite exact-path migration already merged by same-obligation successor #4697.
Correction: a pure exact-path coverage guard in existing terminal-migration-identity module, invoked by existing workflow. Real new/unmatched predecessor migration still fails.
Tests: `tests/brain-terminal-unmerged-supersedes-migration-v1.test.mjs`; positive real lineage, negative missing/unshipped/version drift, provider gate unchanged.
Status: CANDIDATE. Require actual exact-SHA CI/security, native protected merge, provider-run terminal success and readback; no artificial green.
Outstanding #4681: producer direct privileged raw occurrence INSERT; source actor authorization still needs complete gate. #4215 commercial job #46 timeout independent RED.
