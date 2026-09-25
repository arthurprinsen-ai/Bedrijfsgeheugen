# 2026-09-25 — i18n partial-cache production fallback

- Exact production SHA was proven on Netlify.
- Production interaction readback failed with: `English route still shows the Dutch pricing H1`.
- The pricing H1 translation already existed in `config/bg-static-i18n-en.d/2026-09-25-pricing-h1.json`.
- Root cause: offline static i18n discarded the complete cache map when any corpus string was missing.
- Recovery: apply cached English partially and reserve runtime fallback only for uncached strings.
- Regression: `tests/brain-static-i18n-partial-cache-fallback-v1.test.mjs`.
