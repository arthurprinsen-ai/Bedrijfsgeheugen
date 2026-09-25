# Mobile language selector on pre-instrumented pages — 25 September 2026

Production was serving the exact current `main`, but the Playwright pricing readback still failed because the visible mobile language selector was absent after opening the mobile navigation.

The root cause was in `tools/site-shell/apply-i18n.mjs`. The patch function returned immediately whenever the page already contained `data-bg-i18n-asset`. That made asset injection and mobile-selector injection one coupled operation. Pricing already had the runtime assets, so it never reached `injectMobileLanguage()`.

The fix makes both operations independent and idempotent:
- add CSS/JS assets only when missing;
- always run `injectMobileLanguage()`;
- let `data-bg-language-switcher="mobile"` prevent duplicate controls.

The production gate remains the visible mobile NL → EN → NL browser roundtrip.
