# 2026-09-30 — RECOVERY — Persistent public locale navigation v1

- **Fingerprint:** `website|i18n|persistent-public-navigation|v1`.
- **Root cause:** gewone publieke hrefs behielden Dutch routes na keuze voor English.
- **Fix:** locale-aware normalisatie van eligible same-origin links inclusief dynamische navigatie.
- **Owner:** Website/UX + Powerhouse continuity + System Map governance.
- **Regression:** `tests/brain-i18n-persistent-navigation-v1.test.mjs`.
- **Runtime:** `assets/js/i18n.js`.
- **Terminal truth:** cross-page NL/EN browser-readback op productie.
