# 2026-09-24 — Netlify provider build fail-fast diagnostics v1

Evidence:
- OIDC transport acquisition: success
- authorized deploy submission: success
- deploy: `6ab523e2b70db132e952f681`
- build: `6ab523e1b70db132e952f67f`
- provider deploy state: `error`
- exact production SHA readback: timed out because failed deploy could never publish

Change:
- capture deploy/build ids;
- poll Netlify provider state before release identity;
- emit sanitized build/deploy error metadata on provider failure;
- preserve fail-closed exact-SHA and pricing/i18n gates.
