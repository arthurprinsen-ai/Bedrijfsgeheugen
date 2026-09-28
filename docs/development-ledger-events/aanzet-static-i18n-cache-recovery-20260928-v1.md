# 2026-09-28 — RECOVERY — AanZET static i18n cache completeness

- **Fingerprint:** `aanzet-static-i18n-cache-recovery-20260928-v1`
- **Signal:** Netlify production build returned exit code 2 after the AanZET blog became a public sitemap route.
- **Root cause:** newly public Dutch article/card strings had no deterministic English cache entries while `STATIC_I18N_REQUIRE_CACHE=1`.
- **Fix:** add `config/bg-static-i18n-en.d/2026-09-28-aanzet-blog.json`; keep the production fail-closed guard unchanged.
- **Owner:** Content/Growth + Website/i18n.
- **Regression:** `tests/brain-static-i18n-production-cache-completeness-v1.test.mjs` and `tests/brain-static-i18n-production-failclosed-v1.test.mjs`.
- **Verification boundary:** protected merge plus Netlify provider readback before LIVE.
- **Reusable lesson:** a content candidate is incomplete until its localized production representation is deterministic.
