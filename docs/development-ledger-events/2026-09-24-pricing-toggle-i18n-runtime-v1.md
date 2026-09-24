# 2026-09-24 — pricing toggle and i18n runtime closure

Production feedback showed that pricing toggles could be present in HTML yet fail to produce a reliable visible state change, while choosing English on an unprefixed public page still left Dutch content.

Root cause was twofold: production verification only checked control markers rather than interaction outcomes, and the language runtime redirected unprefixed pages to `/en/*`, coupling language switching to localized-route reachability.

The repair makes pricing state explicit in the delegated runtime using semantic state plus visible `display` state, cache-busts the repaired runtime, and switches unprefixed public pages NL/EN in place with persisted locale. Dynamic content follows the active English runtime locale.

Regression coverage:
- `tests/brain-pricing-interactions-functional-v1.test.mjs`
- `tests/brain-pricing-toggle-runtime-v3.test.mjs`
- `tests/brain-i18n-in-place-switch-v1.test.mjs`

Terminal closure still requires protected CI, merge to main, exact Netlify production SHA proof, and production functional readback.
