# 2026-09-24 — Netlify Vault proxy expiry hard boundary

- Fingerprint: `netlify-vault-proxy-expiry-hard-boundary-20260924-v1`
- Main SHA: `dbb0c54d8685b63f2d31f0105fae36f0b1771a10`
- Production snapshot: `36010221414`
- Production readback: `36010220920`
- OIDC bridge auth: success
- Linked build trigger: `ok=false`
- MCP fallback: `401 Unauthorized`
- Existing production deploy: `6ab5131f10d7810008497634`
- Root cause: expired temporary Netlify MCP proxy in Supabase Vault
- Rule: no app-code mutation and no LIVE claim until secret-store-native credential recovery + exact production proof.
