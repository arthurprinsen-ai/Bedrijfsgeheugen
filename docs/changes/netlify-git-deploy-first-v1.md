# Prefer Git-linked Netlify deploy before proxy fallback

Protected-main pushes already trigger Netlify through the repository's native Git integration. The release workflow therefore waits for that exact SHA to become live before it considers the MCP transport fallback.

Only when the bounded Git-linked deployment window expires is `NETLIFY_MCP_PROXY_PATH_TEMP` required. Exact `release.json` identity and the live pricing-content contract remain mandatory after either transport route.

This removes a false release failure without weakening production verification.
