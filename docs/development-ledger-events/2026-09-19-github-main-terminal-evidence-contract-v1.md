# GitHub-main terminal evidence contract v1

- Date: 2026-09-19
- Obligation-ID: github-main-terminal-evidence-contract-v1
- Incident: terminal closure run 35436438329 failed at durable Brain evidence persistence with HTTP 422.
- Root cause: producer emitted `github_main`; Supabase consumer allowed only `canonical_run` and `descendant_live`.
- Change: add fail-closed `github_main` validation, dedicated evidence identity, and regression coverage.
- Safety: deployable runtime surfaces remain governed by canonical production or descendant-live readback.
