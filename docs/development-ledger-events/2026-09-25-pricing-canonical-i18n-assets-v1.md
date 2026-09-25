# 2026-09-25 — pricing canonical i18n assets v1

Observed production failure:
- exact production SHA: `6417fa291ac08345369e1e143abf974fac54f0e4`
- readback run: `36157095751`
- assertion: `visible mobile language select is missing`

Root cause:
- canonical `prijzen.html` had no i18n assets;
- mobile selector is mounted by `assets/js/i18n.js`;
- therefore the control could not exist when exact-source delivery exposed canonical source without build-time injection.

Repair:
- canonical pricing source now includes i18n CSS and runtime;
- source and build paths converge on the same language-control contract;
- terminal browser proof remains mandatory.
