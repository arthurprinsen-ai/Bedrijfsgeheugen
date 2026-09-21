# Activity event — static mobile language selector recovery

- **Fingerprint:** `global-i18n-static-mobile-drawer-injection-v1`
- **Obligation:** `global-nl-en-i18n-v1`
- **Date:** 2026-09-21
- **Observed failure:** production screenshot still showed no NL/EN selector in the open V18 mobile menu.
- **Root cause:** visibility depended on runtime selector discovery across multiple shell generations.
- **Recovery:** the final i18n build injector now writes the selector directly into the canonical `aside.v18-mobile-drawer`, before the login action when present. Runtime mounting remains fallback only.
- **Regression evidence:** `tests/site-shell-global-i18n.test.mjs`.
- **Prevention:** critical global navigation controls must exist in built HTML and not rely solely on late runtime DOM discovery.
- **Terminal state:** open until protected merge and exact production readback.
