# 2026-09-25 — i18n mobile selector on existing-assets pages

Observed:
- Netlify current commit matched protected main;
- production browser verification still failed on pricing;
- failure: `visible mobile language select is missing after opening mobile navigation`.

Root cause:
- `apply-i18n.mjs` returned early when i18n assets already existed;
- pricing therefore received no mobile selector even though the i18n runtime was present.

Action:
- decouple asset injection from control injection;
- keep both operations idempotent;
- add a regression test for pre-instrumented pages;
- require exact-main deploy plus mobile NL/EN roundtrip before terminal closure.

Recurrence:
- the early return on existing `data-bg-i18n-asset` was reintroduced later in the same day;
- exact-main production browser proof again observed zero language selectors on pricing;
- repair reapplied by separating asset installation from mandatory mobile-control injection;
- repeat count raised to 2 in Brain learning.
