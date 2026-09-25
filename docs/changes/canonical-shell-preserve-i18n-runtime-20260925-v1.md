# Canonical shell preserves NL/EN runtime — 2026-09-25

Exact-main production had the V18 mobile drawer and the i18n stylesheet, but the final HTML contained no `/assets/js/i18n.js` script and therefore no `data-bg-language-select` controls.

## Root cause

`tools/site-shell/apply-shell.mjs` rebuilds the page head/body and only retains external scripts listed in `TOEGESTANE_SCRIPTS`. The central i18n runtime was missing from that allowlist. Earlier injection could therefore succeed and still be removed by the final canonical-shell projection.

## Repair

`/assets/js/i18n.js` is now an explicitly permitted canonical public runtime. The existing V18 host support in the runtime mounts the native language selector into `#v18MobileDrawer`.

Terminal acceptance remains exact-main Netlify identity plus pricing lifecycle/run/yearly interactions and NL → EN → NL browser routing on homepage, pricing and systems integration routes.
