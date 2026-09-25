# Pricing billing aria-selected parity — 25 September 2026

Production deployment `c1bde3d41551724f7eaa9e2756d817e8c5e9f236` was exact-SHA live and passed pricing-content proof, but the canonical browser verifier failed after clicking **Jaarlijks**:

`yearly billing aria-selected did not become true`

The visible billing controller and rescue controller used `aria-pressed` but omitted `aria-selected`.

The repair makes both controllers update the same state tuple:
- `aria-pressed`
- `aria-selected`
- `is-active`
- `data-bg-pricing-billing` on the document root
- visible price and billing period

The production Playwright verifier remains the terminal oracle.
