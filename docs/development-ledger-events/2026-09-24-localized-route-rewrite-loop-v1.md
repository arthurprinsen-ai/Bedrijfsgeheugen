# 2026-09-24 — localized route rewrite loop recovery

Observed production evidence: `/en/prijzen` returned an internal error on main `81ef0b2003dfb2ac03276cb84b7d7726ad8b9eac`.

Root cause: recursive Netlify localized wildcard rewrites. Recovery removes those wildcard rules, keeps generated locale files, updates regression coverage and strengthens canonical learning `pricing-toggle-i18n-runtime-20260924-v1` revision 3.

Terminal closure requires protected CI, merge, exact production SHA readback and successful clean `/en/prijzen` production verification.
