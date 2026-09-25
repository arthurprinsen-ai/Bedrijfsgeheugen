# 2026-09-25 — canonical shell stripped i18n runtime

Observed on production SHA `fd7265ad7bdb02e35f0a07cd1f0e750b106c4123`:
- exact Netlify identity and pricing content were green;
- V18 drawer opened successfully;
- production diagnostics showed `v18Selects=0` and `allSelects=0`;
- public HTML had the i18n asset marker but no `/assets/js/i18n.js` script;
- the script asset itself returned HTTP 200 and already contained V18 host support.

Repair: preserve the central i18n runtime in the canonical shell script allowlist and lock it with regression coverage.
