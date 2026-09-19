# GitHub-main terminal evidence contract v1

- Date: 2026-09-19
- Obligation-ID: control-plane-github-main-evidence-v1
- Incident: PR #2330 terminal closure used the new github_main readback successfully, but durable Brain evidence returned HTTP 422 because the API still required a numeric production run id.
- Fix: add explicit production_readback_mode semantics; github_main is valid when verified and observed SHA equals main SHA.
- Safety: canonical_run still requires a positive run id; unverifiable or mismatched GitHub-main evidence fails closed.
