# 2026-09-25 — i18n post-build cache runtime fallback v2

Evidence:
- source cache validation: green;
- production-faithful build: red;
- post-generator missing strings: 1,926;
- first missing: `Aanmelden — begin met inzicht | Bedrijfsgeheugen`.

Repair:
- `STATIC_I18N_NETWORK=0`;
- `STATIC_I18N_REQUIRE_CACHE=0`;
- runtime fallback retained;
- production pricing/i18n browser verifier remains terminal release authority.
