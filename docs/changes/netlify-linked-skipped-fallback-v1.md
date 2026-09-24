# 2026-09-24 — Netlify linked-deploy Skipped fallback

Fingerprint: `netlify-linked-skipped-fallback-v1`

## Probleem

De canonical `Production Source Snapshot` triggerde voor protected main een Git-linked Netlify build. Netlify retourneerde een deploy met `state=error` en `error_message=Skipped`. De workflow behandelde dit als een echte buildfout en stopte, waardoor de bestaande geautoriseerde exact-source MCP fallback nooit werd bereikt.

## Fix

- `Skipped` blijft géén successignaal.
- Bij exact `error_message=Skipped` schakelt de workflow door naar de bestaande OIDC/proxy-geautoriseerde exact-source upload.
- Andere Netlify `state=error` gevallen blijven fail-closed.
- Regression: `tests/brain-netlify-linked-skipped-fallback-v1.test.mjs`.

## Completion

LIVE_BEWEZEN vereist nog steeds provider readback met `ready`, `production` en `commit_ref == protected main`.
