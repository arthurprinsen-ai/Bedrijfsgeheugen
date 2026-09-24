# 2026-09-24 — Netlify OIDC linked-build fallback v1

Observed:
- OIDC bridge authentication succeeded;
- direct MCP deploy command succeeded;
- Netlify current production still exposed an older deploy;
- exact production identity remained pending.

Change:
- add OIDC-authenticated linked-repository build trigger for `main`;
- wait for exact SHA after that build;
- retain MCP deployment only as final transport fallback;
- never expose provider credentials to GitHub logs or repository content.
