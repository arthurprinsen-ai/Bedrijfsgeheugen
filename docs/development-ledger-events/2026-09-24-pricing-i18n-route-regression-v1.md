# 2026-09-24 — restore localized route wildcard invariant

User-visible incident: pricing language switching remained broken in production.

Evidence:
- production `/prijzen` exposed the language-switch failure message;
- production `/en/prijzen` was unavailable;
- current `main` had lost the `/en/*` and `/nl/*` wildcard rewrites previously introduced by PR #2689.

Action in PR #2709:
- restored both nested localized rewrite rules;
- recorded semantic learning fingerprint `pricing-i18n-route-regression-20260924-v1`;
- documented root cause, failed assumptions and prevention;
- closure remains gated on protected CI, merge, production deployment and live nested-route readback.
