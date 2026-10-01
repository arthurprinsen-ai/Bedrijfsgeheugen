# Netlify production transport recovery — 2026-10-01

Obligation: `portal-v2-netlify-exact-production-20261001-v2`

The exact-source production workflow authenticated to the GitHub OIDC bridge, but its stored Netlify MCP proxy credential was stale and the downstream upload returned 401 Unauthorized. The server-side transport credential was rotated from a fresh Netlify-authorized transport. Portal V2 asset versioning was bumped so the canonical production pipeline receives a new material push and exact-SHA deployment/readback is re-executed.

Terminal acceptance remains: merged main SHA equals the Netlify production release marker, immutable deploy readback is green, and Portal V2 DOM readback is green.
