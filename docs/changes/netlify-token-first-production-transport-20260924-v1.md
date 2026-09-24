# Netlify token-first production transport — 24 September 2026

Production Source Snapshot now has a durable transport order when the Git-linked Netlify deploy does not reach the expected SHA:

1. if `NETLIFY_AUTH_TOKEN` exists in GitHub Actions secrets, use authenticated Netlify CLI production deploy;
2. otherwise use the existing `NETLIFY_MCP_PROXY_PATH_TEMP` fallback;
3. if neither exists, fail closed.

No credential value is printed. Terminal proof remains unchanged: exact `release.json` SHA, production context, pricing production content and browser-level pricing/i18n verification must pass.
