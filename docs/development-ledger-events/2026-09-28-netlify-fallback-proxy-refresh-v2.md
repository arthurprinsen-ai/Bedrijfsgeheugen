# 2026-09-28 — Netlify fallback proxy refresh

Observed:
- Production Source Snapshot run `36476034816` targeted main `c3d990dd45d263f4d9c47c5ff90544a38a014ee6`.
- linked-build trigger returned `ok=false`.
- the exact-source fallback reached `@netlify/mcp` and returned `401 Unauthorized`.
- OIDC proxy acquisition had succeeded earlier in the same job.

Root cause:
- a short-lived Netlify proxy was reused after provider polling and fallback preparation.

Action:
- reacquire GitHub OIDC and a fresh Netlify MCP proxy immediately before fallback upload;
- bind the fresh proxy to the upload and subsequent provider watch;
- retain exact-main and browser-readback terminal gates;
- codify the incident in regression, Brain learning and delivery skills.
