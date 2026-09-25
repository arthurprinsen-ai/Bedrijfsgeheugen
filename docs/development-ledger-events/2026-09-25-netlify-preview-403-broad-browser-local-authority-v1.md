# 2026-09-25 — Netlify preview 403 broad-browser isolation

- Fingerprint: `netlify-preview-403-broad-browser-local-authority-20260925-v1`
- PR: #2992
- Required run: `36153195016`
- Browser job: `108131890454`
- Symptom: 27 full-site visibility failures, all HTTP 403 on deploy-preview routes.
- Root cause: broad browser proof reused a preview that had only been proven ready for targeted routes.
- Fix: always serve the exact local candidate for broad/full-site browser checks; preserve preview only for targeted affected-route verification.
- Regression: `tests/delivery-website-browser-runtime-single-install.test.mjs`.
