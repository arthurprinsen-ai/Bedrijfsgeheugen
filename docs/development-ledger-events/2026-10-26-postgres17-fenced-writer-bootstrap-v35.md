# 2026-10-26 — PostgreSQL 17 fenced-writer bootstrap, PR #4966

- Canonical issue: #3742
- Candidate: fix/3742-postgres-lease-bootstrap-v35; protected draft PR #4966.
- Evidence: [GitHub Actions run 40322683206](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40322683206), job `lease-postgres-pr-replay` **success** on head `591e5b807ab85181a2d2d57023e4d77c9a4df6ca`.
- Historical failure: run 40322072979 failed on Bash race assertion syntax; corrected on same branch.
- Admission failure: Required still requires canonical learning, activity ledger, and human-readable change record. These are added in the same PR without disabling the check.
- Source: existing Recovery Supervisor + backend-only SQL + isolated PostgreSQL 17 test; no production database writes.
- Security: no new scheduler; PR event runs only a read-only test; writable recovery job runs only on scheduled/manual event.
- Outstanding: rerun exact-head Required, CodeQL, BRAIN and Supabase Preview, validate writer authorization, then protected merge. Production readback remains **NOT_LIVE** until separately proven.
