# github_main terminal evidence v1

- Date: 2026-09-19
- Obligation-ID: github-main-terminal-evidence-v1
- Incident: PR #2330 proved AUTOMATION_MAIN_READBACK_PROVEN but durable control-plane evidence returned HTTP 422.
- Root cause: Supabase terminal evidence ingest did not recognize the newly introduced github_main mode.
- Fix: add strict github_main validation and distinct durable remote refs while preserving canonical runtime evidence rules.
