# Static Dutch and English website routes

Fingerprint: `global-i18n-static-locale-routes-v1`

The public website no longer relies on translating the complete Dutch page in the visitor's browser after clicking English.

The build now creates two deterministic versions of every public website document: `/nl/...` and `/en/...`. English copy is generated during the production build, not after the visitor clicks. Internal links are rewritten so users remain inside their active language.

Each localized document receives the correct `html lang`, canonical URL and reciprocal `hreflang` links. The language selector navigates between the two corresponding URLs.

If any static English string is unresolved during a production build, the build fails instead of shipping a mixed Dutch/English page. Runtime translation is retained only for dynamic content inserted after the localized page has loaded, such as application-driven UI.
