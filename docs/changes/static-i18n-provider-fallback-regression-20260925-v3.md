# Static i18n provider fallback regression v3 — 25 September 2026

The linked Netlify production build for `main@abdfd8d7dd9bf08dbf95a9fb76a8d5266ef853c1` reached Netlify correctly but failed during the site build.

Inspection of the exact source exposed a contract regression: two obsolete production-fatal guards had returned to `build-localized-routes.mjs`, while the repository simultaneously still contained the newer regression test that requires runtime fallback.

The conflict is resolved as follows:

- build-time Anthropic translation remains enabled in production when available;
- provider failure logs bounded diagnostics and returns `null`;
- English static routes are still emitted with `data-bg-static-translated="false"`;
- the existing runtime i18n layer may translate those pages in place;
- production remains fail-closed on the canonical browser verifier, not on provider availability.

This prevents an external translation-provider problem from taking the entire website offline while still refusing to call English production healthy until the actual user-visible language switch works.
