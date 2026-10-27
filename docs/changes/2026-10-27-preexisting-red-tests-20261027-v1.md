# Pre-existing red tests on main repaired

Nine test files (25 tests) were already failing on main. They now assert the current architecture instead of retired behaviour, and the product and changelog pages no longer claim "ISO 27001-ready"; they say "Data opgeslagen in de EU (Frankfurt)" with an English translation. A duplicate blog post was removed from the blog index, sitemap and RSS feed. The website lane now runs the header-menu contrast check on every website change, as its regression lock requires.

## Validation

`node --test tests/seo-money-page-order-conversion-v2.test.mjs tests/v18-megamenu-regression-lock.test.mjs tests/tabbladen.test.mjs tests/site-shell-global-i18n.test.mjs`

## Boundaries

No runtime or build code changed. Runtime effect is unproven until the protected merge and green main.
