# 2026-09-22 — Secure Netlify source transport

- Fingerprint: secure-netlify-source-transport-v1
- Root cause: Netlify MCP source deploy returned a credential-bearing CLI proxy while the canonical source-snapshot lane lacked transport.
- Fix: opt-in deploy mode with encrypted temporary Actions secret, exact-SHA idempotency, and bounded release.json readback.
- Security: proxy material is never committed or echoed and is deleted after use.
- Evidence: snapshot run 35713466502; stale production 368a652f...; current main a324eaa4....
- Prevention: no production claim until exact SHA, production context and deploy id are proven.
