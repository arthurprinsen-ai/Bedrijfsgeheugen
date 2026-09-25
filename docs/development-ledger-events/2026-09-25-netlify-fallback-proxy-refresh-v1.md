# 2026-09-25 — Netlify fallback proxy refresh

Observed:
- production snapshot run `36162171454` reached the exact-source fallback;
- linked-build trigger returned `ok=false`;
- the fallback Netlify MCP upload failed with `401 Unauthorized`;
- OIDC proxy acquisition had succeeded earlier in the same job.

Root cause:
- a short-lived Netlify proxy was reused after a long linked-build/provider-watch phase.

Action:
- refresh GitHub OIDC and obtain a new Netlify MCP proxy immediately before fallback upload;
- export the fresh proxy for the provider-build watch that follows;
- add regression coverage proving the refresh precedes `@netlify/mcp`;
- retain exact-main and browser-readback terminal gates.
