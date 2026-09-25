# Netlify bridge credential refresh — 2026-09-25

The previous exact-source production promotion failed at the deploy transport layer with HTTP 401. The source artifact itself was exact current main and the product checks had already passed.

This recovery keeps the existing production workflow authoritative and only retriggers it after the canonical short-lived Netlify MCP bridge credential was refreshed.

Terminal proof remains unchanged:
1. protected merge;
2. Production Source Snapshot from exact main;
3. Netlify production commit reference equals exact main;
4. live pricing contract passes;
5. NL/EN browser interaction passes.
