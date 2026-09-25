# NL/EN runtime asset completeness — 25 September 2026

Production reached the exact protected commit, pricing content rendered correctly, and the active mobile navigation opened. The terminal browser proof still failed because no language selector existed anywhere in the DOM.

The decisive production probe showed the real root cause: `/prijzen` contained `assets/i18n.css` with the shared `data-bg-i18n-asset` marker, but did **not** contain `assets/js/i18n.js`. The build transformer in `tools/site-shell/apply-i18n.mjs` returned as soon as it saw any shared i18n marker. Therefore an already-present stylesheet suppressed injection of the missing JavaScript runtime and also prevented mobile-control injection.

The permanent correction is asset-specific and idempotent: CSS and JavaScript are detected and injected independently. After asset reconciliation, mobile language-control injection always runs. The runtime also recognizes the active `#v18MobileDrawer` alongside generic and legacy navigation hosts.

Powerhouse terminal truth for NL/EN now requires all of the following:
- protected-main source;
- Netlify production `commit_ref === main`;
- final production HTML contains both i18n CSS and i18n JavaScript independently;
- the active mobile navigation exposes a visible selector;
- real-browser NL → EN → NL succeeds;
- no visible “Switching language failed. Try again.” error appears.

Regression authority:
- `tests/brain-i18n-asset-independent-injection-v1.test.mjs`
- `tests/brain-i18n-v18-mobile-host-v1.test.mjs`
- `tools/site-shell/verify-pricing-i18n-production.mjs`
