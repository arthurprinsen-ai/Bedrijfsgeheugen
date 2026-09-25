# 2026-09-25 — static i18n runtime fallback production v1

Observed:
- exact production linked build for `66f5051ea8bc299acdd4bef89183bc48f665aeb0`;
- Netlify deploy `6ab686e9c00410eee26a8e5c`;
- production build failed with exit code 2 before publish;
- runtime i18n translation remained present on current main.

Repair:
- keep build-time translation network disabled;
- remove hard cache-completeness requirement from Netlify production;
- retain runtime English fallback;
- retain production pricing/i18n browser proof as terminal gate.
