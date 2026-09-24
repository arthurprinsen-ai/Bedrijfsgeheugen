# 2026-09-24 — i18n production fail-closed

Observed after route-loop recovery: `/en/prijzen` became reachable but remained Dutch and exposed the runtime translation failure message.

Action:
- production static English generation now fails closed on provider failure;
- untranslated `/en/*` production output is forbidden;
- preview/offline behavior remains explicitly non-production;
- regression coverage added;
- canonical learning fingerprint `i18n-production-fail-closed-20260924-v1` added for automatic skill projection.

Terminal closure requires green protected CI, protected merge, a successful Netlify production build and visible English production readback.
