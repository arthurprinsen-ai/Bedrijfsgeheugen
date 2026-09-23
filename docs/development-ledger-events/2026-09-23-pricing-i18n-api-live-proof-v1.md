# 2026-09-23 — pricing/i18n production interaction proof

User feedback proved render-only readback was insufficient. A real browser probe identified the remaining language failure: `/api/i18n-translate` returned 404 although the Netlify function existed. The public rewrite is now explicit, and release CI must execute the actual pricing and English interactions before promotion.
