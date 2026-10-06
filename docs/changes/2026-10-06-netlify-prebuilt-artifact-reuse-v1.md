# Netlify prebuilt artifact reuse v1 — 2026-10-06

The deterministic website transform is now owned by one canonical runner. Required builds it once, validates it, and publishes a short-lived artifact keyed by the immutable Git tree SHA.

After protected merge, Production Source Snapshot may reuse that artifact only when current main resolves to exactly the same tree SHA. The release marker is restamped inside the Netlify build with the actual main commit and deploy id. Missing, expired or mismatched artifacts fall back to the existing full source build.

The static localized-route transform is also sharded across two bounded child processes when network translation is disabled. Network translation remains single-process to prevent concurrent cache writes.
