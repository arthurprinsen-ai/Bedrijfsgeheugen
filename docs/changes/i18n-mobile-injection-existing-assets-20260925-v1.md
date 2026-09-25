# Mobile language selector on pre-instrumented pages — 25 September 2026

Production was serving the exact current `main`, but the Playwright pricing readback still failed because the visible mobile language selector was absent after opening the mobile navigation.

The root cause was in `tools/site-shell/apply-i18n.mjs`. The patch function returned immediately whenever the page already contained `data-bg-i18n-asset`. That made asset injection and mobile-selector injection one coupled operation. Pricing already had the runtime assets, so it never reached `injectMobileLanguage()`.

The fix makes both operations independent and idempotent:
- add CSS/JS assets only when missing;
- always run `injectMobileLanguage()`;
- let `data-bg-language-switcher="mobile"` prevent duplicate controls.

The production gate remains the visible mobile NL → EN → NL browser roundtrip.

## Recurrence on current production lineage
The same early-return pattern was later reintroduced on protected main. Production at `fd7265ad7bdb02e35f0a07cd1f0e750b106c4123` again rendered zero `[data-bg-language-select]` controls on pricing even though the i18n assets were present. The prevention is therefore strengthened: asset idempotence and control idempotence are separate invariants, and the existing-assets regression test must remain green in the protected delivery lane.
