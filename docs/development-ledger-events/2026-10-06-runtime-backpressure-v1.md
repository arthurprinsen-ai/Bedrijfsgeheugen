# 2026-10-06 — POWERHOUSE runtime backpressure

- Base main: `0aba5501ec3e21d28e0cdd0c5628c60088b32258`.
- Incident evidence: 1,224 growth-ingest 522s, 963 CMS 522s, 960 portal-state-eu 500s in two hours.
- Database management SQL also timed out.
- Public CMS: 2.5s origin timeout + 30s breaker + stale fallback.
- Growth visitor path: durable queue only.
- Growth drain: every minute, max 10, stop on first backend failure.
- Regression authority: `tests/brain-powerhouse-runtime-backpressure-v1.test.mjs`.
- Next proof after merge: 401/500/503/522 error-rate readback plus one complete heartbeat cycle.
