# Netlify linked-build error fallback v3 — 25 September 2026

Git-linked Netlify builds can fail even when OIDC authentication and trigger_build succeed. The production workflow already contains an authorized exact-source upload fallback. Delivery must not terminate before trying it.

The linked deploy error is logged, linked_fallback=true is set, and the workflow continues to the canonical exact-source transport.

Safety remains fail-closed: provider deploy must reach ready, release.json must expose the exact expected production SHA, pricing content must pass, and production browser verification must pass.
