# Existing i18n assets no longer suppress the mobile selector — 2026-09-25

## Root cause
`tools/site-shell/apply-i18n.mjs` treated “i18n assets are already present” as “this page needs no i18n patching at all”. That was wrong for pricing: `prijzen.html` intentionally already contains the central i18n stylesheet/script, while the canonical v18 mobile drawer is composed during the build. The early return therefore prevented `injectMobileLanguage()` from ever patching that drawer.

## Repair
Asset insertion and structural selector insertion are now independent idempotent operations. Existing assets are preserved, but `injectMobileLanguage()` always gets a chance to repair the generated mobile navigation. The file is written only if the HTML changed.

## Evidence contract
Regression test: `tests/brain-apply-i18n-existing-assets-mobile-selector-v1.test.mjs`.

Terminal proof remains: protected merge → exact-main Netlify production → visible v18 language selector → NL→EN→NL browser proof on homepage, pricing and systems/koppelingen.
