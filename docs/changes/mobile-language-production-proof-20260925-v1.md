# Mobile language production proof — 25 September 2026

## Incident
The exact production SHA was deployed successfully and pricing lifecycle, run-tab, yearly billing and production-content checks passed. The final NL/EN browser gate then timed out while clicking `button[data-bg-language-current]` at a 390×844 viewport.

The button existed in the DOM but was intentionally hidden on mobile.

## Root cause
The browser verifier used the desktop language control while running a mobile viewport. The actual mobile language UX is mounted by `assets/js/i18n.js` as a `[data-bg-language-select]` inside the mobile menu opened by `#bgkopKnop`.

## Fix
The production browser proof now follows the real mobile user path:
1. open the mobile menu;
2. select English in the visible mobile language selector;
3. prove `/en/prijzen`, `html[lang=en]`, visible English Pricing content and no runtime-translation error;
4. reopen the mobile menu;
5. select Dutch and prove canonical `/prijzen` with `html[lang=nl]`.

No product assertion is weakened; the gate now targets the correct visible control.
