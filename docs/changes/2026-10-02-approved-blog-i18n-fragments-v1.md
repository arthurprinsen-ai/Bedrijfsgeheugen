# Approved blog post-transform i18n recovery

The first cache recovery covered the article's checked-in source strings. The exact production build then split or synthesized twelve additional visible fragments after the early cache-validation stage.

This recovery adds only those twelve observed fragments to the existing deterministic English patch file. Production remains fail-closed with `STATIC_I18N_REQUIRE_CACHE=1`; no runtime/network fallback is introduced.
