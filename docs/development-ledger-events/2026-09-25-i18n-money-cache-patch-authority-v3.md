# Development ledger — i18n money cache patch authority v3

- Date: 2026-09-25
- Failure: Netlify preview/production build exited 2 while GitHub full build was green.
- Isolated cause: base cache migrated to `config/`; seven-entry incremental money-page patch remained under retired `.cache/`.
- Patch blob: `f26c933c4a8dec4f00798ac38c8d0c91963373a2`.
- Correct authority: `config/bg-static-i18n-en.d/2026-09-25-money-pages.json`.
- Old authority removed: `.cache/bg-static-i18n-en.d/2026-09-25-money-pages.json`.
- Build mode remains deterministic: network off + cache required.
- Terminal requirement: protected merge → exact-main Netlify production → release identity → NL↔EN browser proof.
