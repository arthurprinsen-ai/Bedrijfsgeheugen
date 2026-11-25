# Frisse Blik — accurate conversion and SEO offer metadata

The source `frisse-blik.html` had inconsistent search and social descriptions for a commercial scan: its meta description mentioned a fixed price, but Open Graph called it free and JSON-LD declared `offers.price=0 EUR`. The public journey distinguishes the free selfscan from Frisse Blik's priced service.

This protected change removes the unjustified zero-price structured claim, clarifies the two entry routes without inventing a numeric tariff, and retains the existing canonical and call-to-action links. No automatic price changes, visitor tracking alteration, duplicate scheduler or unverified conversion claim. Real provider observations and site-side lead/order attribution are necessary to measure any commercial improvement after deployment.

Regression: `node --test tests/brain-frisse-blik-commercial-price-truth-v1.test.mjs`. Terminal: protected Required/CodeQL, Netlify production readback and only then future observed conversion outcomes.
