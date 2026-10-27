# Netlify production transport recovery

This recovery rotates the stale Netlify upload transport used by the exact-source production workflow and triggers a fresh Portal V2 asset release. No customer-facing information architecture or functional behavior is intentionally changed.

The production claim remains fail-closed: a PR, merge, queued build, or older ready deploy is not LIVE. The exact merged SHA must be served by Netlify and verified by production readback.
