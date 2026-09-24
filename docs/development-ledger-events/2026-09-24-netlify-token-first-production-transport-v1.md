# 2026-09-24 — Netlify token-first production transport v1

Added a durable CI transport fallback to Production Source Snapshot.

Observed problem:
- Git-linked production did not advance to current main;
- MCP fallback had previously failed after proxy expiry.

Change:
- prefer existing `NETLIFY_AUTH_TOKEN` via `netlify deploy --build --prod`;
- fall back to the MCP proxy only when token auth is unavailable;
- preserve exact SHA and pricing/i18n production readback as terminal gates.
