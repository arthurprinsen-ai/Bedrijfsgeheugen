# Prefer Git-linked Netlify production before proxy fallback

The production release path now treats the repository's native Git-to-Netlify integration as the primary transport on protected-main pushes.

The workflow waits for a bounded window for `release.json` to expose the exact expected SHA. If that succeeds, no proxy secret is required. Only when the Git-linked deploy fails to arrive does the workflow require `NETLIFY_MCP_PROXY_PATH_TEMP` and invoke the MCP transport fallback.

Exact production identity and the pricing content proof still run after either transport route, so this change removes a false configuration dependency without weakening release verification.
