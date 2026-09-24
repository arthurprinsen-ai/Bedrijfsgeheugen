# 2026-09-24 — pricing toggle and i18n runtime closure

Production feedback showed that pricing toggles could exist in HTML yet fail to change visible state, while selecting English could still leave Dutch content.

Canonical closure:
- pricing controls require browser-observed state change;
- public website language selection uses prebuilt `/nl/*` and `/en/*` routes;
- runtime/in-place translation is fallback and remains acceptable inside portal contexts;
- the old contradictory public in-place regression was removed/replaced;
- the i18n learning is revision 4 and explicitly forbids conflicting switching contracts.

Regression coverage:
- `tests/brain-pricing-interactions-functional-v1.test.mjs`
- `tests/brain-pricing-toggle-runtime-v3.test.mjs`
- `tests/brain-i18n-in-place-switch-v1.test.mjs`
- `tests/brain-pricing-i18n-prevention-skill-v1.test.mjs`

Terminal closure still requires protected CI, merge to main, exact Netlify production SHA proof, and production functional readback.
