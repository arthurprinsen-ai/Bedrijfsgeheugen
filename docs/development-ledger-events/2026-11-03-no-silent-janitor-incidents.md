# Ledger — P0 original Janitor incident observability 2026-11-03
- Signal: native source GitHub run 41546047078; 19 deferred old terminal lineages with successful cleanup and readback; their lack of Brain occurrence is a source-observer coverage defect.
- Cause: observer used only failed native step results and silently defaulted unreadable `janitor-runtime-actions.json` to an empty array.
- Existing owner: canonical Powerhouse GitHub Janitor, parent incident #5320. No new workflow/cron/writer or separate registry.
- Repair: typed `INCIDENT_OPEN_HISTORY_UNPROVEN` and `INCIDENT_OPEN_EVIDENCE_MISSING` with source provenance; issue+Brain occurrence writeback and readback; failure of either is nonzero original job.
- Prevention: explicit failure classes, deterministic run-attempt IDs and fingerprints, bounded safe repair; no cosmetic green. Root cause and next action remain open until independently proven.
- Scope: Janitor-only; all-agent instrumentation and existing archive tag GitHub403 remain distinct obligations, no unwarranted all-green claim.
- Verification: historical/shadow/canary `tests/brain-janitor-no-silent-incident-20261103.test.mjs`, original Required+CodeQL+BRAIN, protected merge and native production source readback due.
