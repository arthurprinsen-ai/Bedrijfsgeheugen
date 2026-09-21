# 2026-09-21 — Immediate Composio secret sync after deploy

- Fingerprint: `composio-secret-sync-deploy-trigger-v1`
- Observed: production scheduled function is live but direct URL invocation returns HTTP 403 by platform design.
- Root cause: cron-only execution delays first cross-runtime binding until the next scheduled time.
- Change: reuse the canonical status-first sync from a production-only `deploySucceeded` event handler.
- Security: platform event only; no public route, no secret echo/log, no browser secret transport.
- Publication authority: unchanged; this handler writes configuration only and cannot publish social content.
