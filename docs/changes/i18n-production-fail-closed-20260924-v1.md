# Public i18n production fail-closed — 24 September 2026

## Failure

The clean production route `/en/prijzen` existed, but still contained Dutch copy and exposed the runtime message `Switching language failed. Try again.`.

## Root cause

`tools/site-shell/build-localized-routes.mjs` treated a failed static translation provider as a recoverable production condition. It emitted `/en/*` artifacts with `data-bg-static-translated=false`, and the browser then attempted runtime translation. That created two provider-dependent failure points and allowed an English URL to serve Dutch content.

## Permanent rule

When `STATIC_I18N_NETWORK=1` (production), static English translation is mandatory. Provider failure or incomplete translation fails the build. Production never publishes an untranslated English route.

Deploy previews remain allowed to run with `STATIC_I18N_NETWORK=0`; those artifacts are explicitly non-production evidence.

Production proof remains user-observable: the browser must see English content, not just `lang=en` or an `/en/` URL.
