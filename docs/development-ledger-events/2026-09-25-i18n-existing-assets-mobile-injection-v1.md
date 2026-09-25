# 2026-09-25 — i18n existing-assets mobile injection recovery

Observed:
- Netlify production `commit_ref` matched protected `main` at `fd7265ad7bdb02e35f0a07cd1f0e750b106c4123`;
- production snapshot run `36161161127` failed browser verification;
- after opening mobile navigation, diagnostics showed zero language selects across v18, legacy, shared and global scopes.

Root cause:
- `apply-i18n.mjs` returned immediately when `data-bg-i18n-asset` was already present;
- the final-shell mobile control injection was therefore skipped.

Action:
- decouple asset idempotence from mobile-control injection;
- preserve the existing i18n assets;
- always run `injectMobileLanguage()` on final built HTML;
- retain exact-main and mobile NL/EN roundtrip as terminal gates.
