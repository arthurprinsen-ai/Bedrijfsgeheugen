# Developer ledger — original website brand-media aliases — 10 November 2026

- **Root:** Netlify missing `/og-image.png` and `/favicon.ico`; independent HTTP 404 response HTML in provider request IDs 26723/26724.
- **Existing target truth:** original media `/assets/merk/banner-instagram-tegel.jpg` and `/favicon.png` verified 200 with correct MIME in request IDs 26727/26728.
- **Fix:** two exact 301 Netlify `_redirects` aliases; no new image generation, database write, alternate site, sender or scheduler.
- **Regression:** `tests/brain-public-brand-media-aliases-20261110.test.mjs` enforces single absolute same-site target, file existence, homepage OG URL. Fail closed if invalid.
- **Release:** protected main, Netlify exact SHA and new HTTP response; until readback, source-only.
- **Parent:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
