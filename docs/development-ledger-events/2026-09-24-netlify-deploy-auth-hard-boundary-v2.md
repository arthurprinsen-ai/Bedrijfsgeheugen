# 2026-09-24 — Netlify deploy-auth hard-boundary v2

Evidence:
- main: `1b49aa2b9c5acbb1d10138b4c07e92585193d0d1`
- Production Source Snapshot run: `35991169738`
- exact source artifact: `10803924073`
- provider result: `401 Unauthorized`
- direct exact-artifact fallback: no provider deploy registered

Actions:
- preserved exact current-main artifact;
- classified incident as deployment authentication;
- prohibited further blind stale-credential retries;
- added explicit hard-boundary rule;
- updated Powerhouse continuity skill;
- added regression coverage and human documentation.

Required continuation after account-level auth recovery:
canonical Production Source Snapshot → exact SHA readback → pricing/i18n browser proof → terminal closure.
