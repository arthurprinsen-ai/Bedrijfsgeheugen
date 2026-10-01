# Contact identity static-i18n recovery — 2026-10-01

The contact identity correction reached main, but the Netlify production build stopped in the deterministic site-build stage. The changed public Dutch copy participates in the localized-route compiler, while its new English cache entries were missing.

Recovery: add the exact contact identity sentence and paragraph variants to the fail-closed static English cache. Keep STATIC_I18N_REQUIRE_CACHE enabled and require a green Netlify preview/build before the next production promotion.
