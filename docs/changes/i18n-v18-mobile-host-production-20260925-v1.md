# Active v18 mobile language host — 25 September 2026

Production reached the exact protected commit, and the improved Playwright verifier opened the real mobile navigation. The browser evidence was decisive: `#v18MobileDrawer` was open (`aria-hidden=false`), but `v18Selects=0` and `allSelects=0`.

The runtime root cause was in `assets/js/i18n.js`. `mountControl()` knew about generic mobile roots and the older `#bgkopMob`, but not about the active `#v18MobileDrawer`. Therefore the runtime never mounted the language selector into the navigation customers actually use.

The recovery adds `#v18MobileDrawer` as a first-class mobile host while preserving the generic and legacy hosts. Regression coverage locks the runtime host and the production verifier to the same active drawer.

Terminal proof remains: protected merge, Netlify `commit_ref === main`, and successful visible mobile NL → EN → NL pricing roundtrip.
