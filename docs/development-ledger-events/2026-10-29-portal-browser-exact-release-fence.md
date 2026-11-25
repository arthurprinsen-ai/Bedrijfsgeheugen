# Development ledger — 29 oktober 2026, fail-closed canonical production browser readback

Fingerprint `delivery|portal|immutable-netlify-alias-browser-403-or-no-response|20261029-v1`.
Measured incident: Github production-dom-readback for exact main `481c2903ceba2f4e9163f62a4ec8925468b21a3b` failed on first browser immutable-alias 403 and replay no-response, with 14 other tests passing in each run. Repeating the identical browser job was insufficient.

Changed existing protected `.github/workflows/portal-v2-production-dom-readback.yml`: before browser usage, verify the immutable SHA+deploy and canonical public SHA+deploy with the same exact expected manifest; use actual main public browser host for DOM/mobile/visual; reverify exact version after all checks. Keep the immutable source, auth and visual baseline protection. Add CI-only source guard `tools/ci/portal-canonical-browser-release-fence.mjs`, negative tests, ONE BRAIN root cause and human change notes.

No release auth bypass, no fake green, no browser skip, no new executor, no database write. Terminal browser and production outcome remain pending protected merge + exact approved workflow dispatch.
