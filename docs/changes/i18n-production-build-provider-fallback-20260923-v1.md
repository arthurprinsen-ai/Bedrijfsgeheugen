# I18n production build provider fallback — 2026-09-23

## Root cause

Production enables static English generation through the Anthropic API. A provider/network failure was treated as fatal even though the website already has runtime i18n fallback. Netlify therefore failed the entire production build while deploy previews remained healthy.

## Fix

Static English translation is now best-effort. If the provider fails after bounded retries, the build logs `STATIC_I18N_PROVIDER_FALLBACK`, generates localized route shells without static English, and lets the existing runtime i18n path translate the page.

## Prevention

External enrichment must not become a single point of failure for website deployment when an equivalent runtime fallback exists. Exact production SHA and live pricing interaction proof remain mandatory.
