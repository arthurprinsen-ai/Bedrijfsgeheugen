# Static i18n post-build cache fallback — 25 September 2026

A production-faithful diagnostic reproduced the Netlify failure outside Netlify. The source cache validation passed, but the full build then generated additional HTML and introduced 1,926 strings that were not present in the pre-build cache. The release therefore failed with `STATIC_I18N_CACHE_INCOMPLETE`.

Production remains network-independent. The cache is still used, but cache completeness is no longer a publication prerequisite after mutating generators. Missing post-build strings are handled by the existing runtime i18n fallback. Terminal quality stays fail-closed at the production browser gate: `/en/prijzen` must visibly render English before release closure.
