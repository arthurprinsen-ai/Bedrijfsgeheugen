# I18n partial-asset completeness — 25 September 2026

## Proven production symptom

The exact-main Netlify deploy was healthy and the pricing content contract passed, yet the production browser reported zero mobile language selectors.

Direct readback of the served `/prijzen` HTML showed:

- `assets/i18n.css`: present;
- `assets/js/i18n.js`: absent;
- mobile language selectors: zero.

## Refined root cause

The i18n build transformer treated one generic `data-bg-i18n-asset` marker as proof that the entire i18n runtime was installed. Pricing already carried the stylesheet marker, so the transformer returned early before injecting the missing JavaScript runtime and mobile language control.

This refines the earlier active-mobile-host diagnosis. The host support remains required, but it cannot execute when the runtime script itself is missing.

## Permanent Powerhouse rule

Multi-asset contracts are verified per required component. A partial marker is never completeness proof. Build transforms must be idempotent, final served HTML must be checked, and terminal production proof requires the real mobile NL → EN → NL browser roundtrip.
