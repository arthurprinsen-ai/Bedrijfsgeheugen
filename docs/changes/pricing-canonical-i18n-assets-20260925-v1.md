# Pricing canonical i18n assets — 25 September 2026

Production release readback on `6417fa291ac08345369e1e143abf974fac54f0e4` reached exact Netlify production successfully, but the pricing browser gate failed with:

`visible mobile language select is missing`

Root cause: `prijzen.html` did not carry the canonical i18n CSS/runtime assets itself. The normal build injector could add them, but exact-source delivery cannot depend on that enrichment for a critical language control.

Repair:
- add `/assets/i18n.css` to canonical `prijzen.html`;
- add `/assets/js/i18n.js` to canonical `prijzen.html`;
- mark both with `data-bg-i18n-asset` so `apply-i18n.mjs` stays idempotent;
- keep production browser proof as terminal oracle.
