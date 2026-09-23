# 2026-09-23 — i18n production build provider fallback

Observed production deploy `6ab414eb5de9a8c4d1c9417f` failed at Netlify build stage with exit code 2 while preview CI passed. The production-only difference is static i18n network mode.

Implemented a fail-safe fallback in `build-localized-routes.mjs`: after bounded provider retries, translation failure no longer aborts deployment and the existing runtime i18n path remains responsible for English.

Closure requires protected CI, merge, exact Netlify production SHA proof and live pricing route proof.
