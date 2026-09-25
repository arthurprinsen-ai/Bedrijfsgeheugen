# Static i18n production fail-closed recovery — 25 September 2026

Production was serving the exact protected `main` commit, but `/en/prijzen` still showed the Dutch pricing H1.

The cache entries for `Prijzen voor`, `digitalisering`, and `in het mkb` were valid English translations. The actual defect was the Netlify production environment contract: `STATIC_I18N_NETWORK=0` was combined with `STATIC_I18N_REQUIRE_CACHE=0`.

With that combination, if even one current build string was absent from the immutable cache, the localized route builder skipped static English generation for the entire route set and still emitted `/en/*` pages. The result could therefore have an English URL and `lang=en` while retaining Dutch body content.

Production is restored to fail-closed behavior: `STATIC_I18N_REQUIRE_CACHE=1`. Any cache drift now blocks the build instead of publishing untranslated English pages.

Terminal proof remains exact-main Netlify commit equality plus mobile NL→EN→NL browser verification with semantic English-content checks.
