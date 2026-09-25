# Static i18n runtime fallback in production — 25 September 2026

Netlify production build failed on the offline static English cache. Production intentionally disables build-time provider calls with `STATIC_I18N_NETWORK=0`, while the public runtime i18n layer translates English routes through `/api/i18n-translate`.

The production configuration now keeps the network-off rule but no longer makes cache completeness a hard publication dependency:

- `STATIC_I18N_NETWORK=0`
- `STATIC_I18N_REQUIRE_CACHE=0`

This does not weaken terminal verification. The canonical production browser verifier still must prove the actual language switch, `/en/prijzen`, `html lang=en`, visible English pricing text and absence of the Dutch pricing H1 before the release is closed as LIVE_BEWEZEN.
