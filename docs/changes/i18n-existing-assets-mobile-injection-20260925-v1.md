# I18n mobile injection with pre-existing assets — 25 September 2026

## Incident

Production was already serving the exact current `main` SHA, but the terminal Playwright gate still failed on the mobile pricing route because no visible language select existed after opening mobile navigation.

## Root cause

`tools/site-shell/apply-i18n.mjs` used one early return for two different concerns:

- whether the i18n CSS/JS assets were already present;
- whether the final mobile navigation already contained the language control.

On pricing pages the assets were already present before the final v18 shell was projected. The script therefore returned before calling `injectMobileLanguage()`, so the final mobile drawer had zero language selects.

## Fix

Asset injection and mobile-control injection are now independent. Existing assets suppress only duplicate asset insertion; `injectMobileLanguage()` still runs on the final built HTML.

The production gate remains the mobile NL→EN→NL browser proof on the mandatory public routes.
