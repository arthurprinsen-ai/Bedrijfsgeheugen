# 2026-09-25 — static i18n cache authority delta v1

Observed:
- immutable production cache contained 7,707 entries;
- canonical validation reported 126 missing translations;
- 119 came from the AI ecosystem/homepage surface;
- 7 came from a money-page patch stored only under mutable `.cache/`;
- stale tests still expected `STATIC_I18N_NETWORK=1`.

Actions:
- add 126-entry versioned release patch at `config/bg-static-i18n-en.d/2026-09-25-ai-ecosystem-money-pages.json`;
- align deterministic/fail-closed/provider tests with cache-only production;
- retain strict cache validation as the release gate.
