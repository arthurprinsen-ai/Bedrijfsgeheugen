# Explicit public locale navigation recovery

**Date:** 2026-09-30  
**Fingerprint:** `website|i18n|explicit-public-locale-navigation|v2`

## Observed production behavior
Exact-main Netlify production was ready and the Company Brain route returned HTTP 200 with the correct canonical identity on mobile and desktop. The remaining production gate failed only when the mobile language control on `/prijzen` attempted NL → EN and waited for `/en/prijzen`.

## Root cause
The public language option saved the selected locale but relied on the anchor's implicit browser-default navigation after mobile menu state changed during the same click. That navigation was not reliable in the production browser.

## Fix
For public routes, `[data-bg-language-option]` now:
1. persists the chosen locale;
2. prevents implicit/default navigation;
3. resolves the localized href;
4. closes open menus;
5. explicitly calls `location.assign(href)`.

Portal behavior remains unchanged.

## Terminal proof
The existing production canary `tools/site-shell/verify-pricing-i18n-production.mjs` must prove NL → EN → NL, while Company Brain remains HTTP 200/canonical/visible.
