# Netlify preview 403 vs broad browser authority

Fingerprint: `netlify-preview-403-broad-browser-local-authority-20260925-v1`

PR #2992 passed targeted preview readiness and Netlify build-parity, but the full public-page visibility sweep reused the Netlify deploy-preview URL. Twenty-seven checks then failed with HTTP 403 across unrelated routes and viewports.

This was provider-preview accessibility failure, not evidence that those pages were visually broken.

Permanent rule: targeted affected-route checks may use a Netlify preview only after those exact routes are proven reachable. Full-site visibility, header/menu and broad high-risk browser checks always run against the exact locally built candidate for the same SHA.

Regression authority: `tests/delivery-website-browser-runtime-single-install.test.mjs`.
