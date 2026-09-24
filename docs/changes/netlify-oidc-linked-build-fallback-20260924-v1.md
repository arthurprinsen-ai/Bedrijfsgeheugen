# Netlify OIDC linked-build fallback — 24 September 2026

The canonical production workflow now uses four ordered stages:

1. wait briefly for the normal Git-linked Netlify deploy;
2. if the exact SHA is still absent, use GitHub OIDC to ask the server-side Netlify bridge to trigger a linked-repository build for branch `main`;
3. wait for that linked build to publish the exact SHA;
4. only if it still does not, use the existing MCP deploy fallback.

The bridge keeps the Netlify proxy credential server-side. GitHub receives only non-secret build/deploy identifiers.

Terminal closure remains fail-closed: exact production SHA + production context + pricing-content proof + pricing/i18n browser proof.
