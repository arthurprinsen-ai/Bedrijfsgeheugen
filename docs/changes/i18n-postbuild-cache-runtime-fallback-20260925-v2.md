# Static i18n post-build cache fallback — 25 September 2026

A production-faithful diagnostic reproduced the Netlify failure outside Netlify. Source cache validation passed, but the full build generated additional markup and introduced 1,926 strings not present in the pre-build cache. The build then failed with `STATIC_I18N_CACHE_INCOMPLETE`.

Production remains network-independent. The cache is retained, but post-build completeness is no longer a publication prerequisite. Missing generated strings are handled by the canonical runtime i18n fallback. Release closure remains fail-closed at the production browser gate: `/en/prijzen` must visibly render English.
