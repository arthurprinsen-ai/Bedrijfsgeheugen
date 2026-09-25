# 2026-09-25 — static i18n terminal fail-closed recovery

Observed:
- protected main and Netlify commit_ref matched at `89cc01bf96104a4436205567e7ff71850911d858`;
- production snapshot run `36162844641` failed because `/en/prijzen` still showed the Dutch pricing H1;
- production build policy had `STATIC_I18N_NETWORK=0` and `STATIC_I18N_REQUIRE_CACHE=0`;
- restoring the previously validated cache left exactly one invalid cache key: the volatile version timestamp.

Root cause:
- English production could silently fall back to untranslated source;
- build-time operational metadata was incorrectly part of the translatable corpus.

Action:
- restore complete immutable English cache authority;
- exclude dynamic version stamp from translation;
- reinstate `STATIC_I18N_REQUIRE_CACHE=1`;
- require exact-main deploy plus browser NL/EN roundtrip before LIVE_BEWEZEN.
