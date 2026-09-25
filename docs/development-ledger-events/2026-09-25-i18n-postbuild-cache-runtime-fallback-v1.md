# 2026-09-25 — i18n post-build cache runtime fallback v1

Evidence:
- static cache-only validation: green;
- full production-faithful build: red;
- missing strings after generators: 1,926;
- first missing string: `Aanmelden — begin met inzicht | Bedrijfsgeheugen`.

Repair:
- keep `STATIC_I18N_NETWORK=0`;
- set `STATIC_I18N_REQUIRE_CACHE=0`;
- preserve runtime fallback and production browser proof as terminal gate.
