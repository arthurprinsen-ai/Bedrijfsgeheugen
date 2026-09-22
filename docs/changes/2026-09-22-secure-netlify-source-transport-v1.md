# Secure Netlify source transport

Production Source Snapshot can now optionally continue from exact-source packaging into the authorized Netlify MCP transport.

The deploy mode is explicit and fail-closed. It reads current production first and creates no second provider side effect when the exact SHA is already live. The temporary Netlify MCP proxy is supplied only through an encrypted GitHub Actions secret and is never committed or printed.

After the provider call the same workflow polls release.json and succeeds only when commit_ref equals the dispatched GitHub SHA, context is production, and a deploy id exists. The controlling agent deletes the temporary secret after execution.
