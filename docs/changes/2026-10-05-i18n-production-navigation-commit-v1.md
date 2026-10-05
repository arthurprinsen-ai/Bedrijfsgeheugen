# I18n production navigation readback — commit proof

Date: 2026-10-05

The production locale browser proof could report a false failure after a correct NL → EN click because `page.waitForURL` was coupled to `DOMContentLoaded`. The exact Netlify production SHA, pricing content and static English route were already correct.

The verifier now separates the proofs:

1. the real language control must be clicked;
2. the browser must commit navigation to the exact expected pathname;
3. the new document body must become visible;
4. `html[lang]` must equal the selected locale;
5. localized content must be visible and no runtime translation error may be present.

This keeps the readback fail-closed for broken navigation or localization, while removing a lifecycle-timing false negative. The existing learning fingerprint `i18n-production-navigation-readback-20260930-v1` is updated rather than creating a parallel prevention rule.
