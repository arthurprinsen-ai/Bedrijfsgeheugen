# Netlify linked-build error fallback v5 — 25 September 2026

A Git-linked Netlify build can fail while the authenticated exact-source upload transport remains available. The production workflow must therefore record the linked-build failure and continue to the canonical exact-source fallback instead of terminating early.

This is not a bypass. Delivery remains fail-closed until the provider deploy is ready, release.json proves the exact production SHA, pricing content is verified, and the production browser checks pass.

This v5 successor is rebuilt from the current main and is the canonical owner; older duplicate fallback PRs are superseded and closed.
