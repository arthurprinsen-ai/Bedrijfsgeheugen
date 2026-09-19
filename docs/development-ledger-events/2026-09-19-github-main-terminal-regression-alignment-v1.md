# github_main regression alignment v1

- Date: 2026-09-19
- Obligation-ID: github-main-terminal-regression-alignment-v1
- Incident: BRAIN backend lane failed after #2331 because a legacy test still expected only canonical_run and descendant_live.
- Fix: align the regression with the strict github_main contract and add explicit separation assertions.
