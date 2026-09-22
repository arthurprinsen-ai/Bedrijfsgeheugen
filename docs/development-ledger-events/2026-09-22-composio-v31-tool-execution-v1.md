# Development ledger — composio-v31-tool-execution-v1

- Date: 2026-09-22
- Incident: LinkedIn Composio connected account was active, but `LINKEDIN_GET_MY_INFO` failed with HTTP 400.
- Root cause: direct execution used `/api/v3/tools/execute/*`, which resolves to the pinned/base toolkit version unless explicitly versioned.
- Fix: use `/api/v3.1/tools/execute/*` for LinkedIn capability discovery and the shared social publisher Composio executor.
- Scope: LinkedIn readback + Instagram Composio write/readback transport.
- Safety: no auth tokens or provider secrets exposed; publication authority and dedupe gates unchanged.
- Terminal proof required: exact-head CI, protected merge, Supabase function deploy, provider capability state readback.
