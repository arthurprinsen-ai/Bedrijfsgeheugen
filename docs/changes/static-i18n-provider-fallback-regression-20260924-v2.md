# Static i18n provider fallback regression — 24 September 2026

Production build of `main@92ffad0a568d33679501f3562dfabe5dddd80452` reached the static locale build and repeatedly received HTTP 400 from Anthropic. The build then threw `STATIC_I18N_PRODUCTION_TRANSLATION_FAILED`, preventing publication.

This contradicted the existing fallback architecture: `/en/*` routes can be emitted with `data-bg-static-translated="false"` and translated by the existing runtime i18n layer. The repair restores that contract while preserving terminal browser verification.

Changes:
- non-transient 4xx fails fast instead of retrying six times;
- bounded provider response body is logged for diagnosis;
- provider failure returns the runtime fallback path instead of aborting production;
- the production-only fatal translation-required check is removed;
- exact browser proof remains mandatory before `LIVE_BEWEZEN`.

No API key or credential is written to logs, docs, source or PR metadata.
