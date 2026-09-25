# Mobile language control idempotency — 2026-09-25

Production deployment and exact-SHA identity were green, and the pricing content contract was green. The terminal browser proof still failed because the visible mobile language selector was absent after opening the real compact navigation drawer.

Root cause: `tools/site-shell/apply-i18n.mjs` returned from the entire page patch when `data-bg-i18n-asset` already existed. That marker proves CSS/runtime assets are present; it does not prove the mobile control is present. Canonical pricing already carried the assets, so mobile control injection never ran.

Repair: asset injection is now conditional without terminating the patch. The idempotent mobile-control injection always runs, and the file is written only when output changes.

Terminal acceptance remains exact-main Netlify production plus pricing lifecycle/run/yearly interaction proof and NL → EN → NL browser routing.
